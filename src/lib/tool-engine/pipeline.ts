import type { z } from "zod"
import type {
  ToolContext,
  ToolEngine,
  ToolEngineConfig,
  ToolInput,
  ToolOutput,
  ToolRunOptions,
  ToolRunResult,
  ToolValidationResult,
} from "./types"
import { ToolExecutionError } from "./types"
import { runSchemaValidation, zodIssuesToIssues } from "./validation"
import { toToolError } from "./errors"

/**
 * Execution pipeline — the reusable heart of every tool.
 *
 * Each run follows: normalize input → validate (timed) → process
 * (timed) → produce a measured result. Side-effect stages (history,
 * analytics, metrics) are injected via `onSuccess`/`onError` so the
 * pipeline stays pure, testable, and identical across all tools.
 */

/** Create a fresh engine instance for one tool. No shared mutable state. */
export function createToolEngine<TSchema extends z.ZodTypeAny, TOutput extends ToolOutput>(
  config: ToolEngineConfig<TSchema, TOutput>
): ToolEngine<TSchema, TOutput> {
  const { toolId, schema, normalize, process } = config

  const normalizeInput = (raw: ToolInput): ToolInput => (normalize ? normalize(raw) : raw)

  const validate = (raw: ToolInput): ToolValidationResult =>
    runSchemaValidation(schema, normalizeInput(raw))

  const run = async (
    raw: ToolInput,
    options: ToolRunOptions<TOutput> = {}
  ): Promise<ToolRunResult<TOutput>> => {
    const runId = createRunId()
    const startedAt = now()
    const normalized = normalizeInput(raw)

    options.onPhase?.("validating")
    const parseStartedAt = now()
    const parsed = schema.safeParse(normalized)
    const validationMs = now() - parseStartedAt

    if (!parsed.success) {
      const issues = zodIssuesToIssues(parsed.error.issues)
      const error = new ToolExecutionError(
        "VALIDATION",
        "Please fix your input and try again.",
        issues
      )
      options.onError?.(error)
      throw error
    }

    options.onPhase?.("processing")
    const context: ToolContext = { toolId, startedAt }
    const processStartedAt = now()
    let output: TOutput
    try {
      output = await process(parsed.data, context)
    } catch (error) {
      const wrapped = toToolError(error)
      options.onError?.(wrapped)
      throw wrapped
    }
    const processingMs = now() - processStartedAt

    const result: ToolRunResult<TOutput> = {
      output,
      runId,
      metrics: { validationMs, processingMs, startedAt },
    }
    options.onSuccess?.(result)
    return result
  }

  return { toolId, schema, validate, run }
}

function createRunId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID()
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
}

function now(): number {
  return typeof performance !== "undefined" ? performance.now() : Date.now()
}
