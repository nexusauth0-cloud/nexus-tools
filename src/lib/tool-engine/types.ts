import type { z } from "zod"

/**
 * Shared Tool Engine — core generic types.
 *
 * A tool is described by an input schema (Zod), processing logic, and an
 * optional manifest. Everything else — validation, execution timing,
 * history, analytics, export, and UI — is provided by the engine.
 */

/** User-supplied raw input for a tool. Tools narrow it via their schema. */
export type ToolInput = Record<string, unknown>

/** Anything a tool can produce. */
export type ToolOutput = unknown

/** Any Zod schema, used as a tool's input contract. */
export type ToolInputSchema = z.ZodTypeAny

/** Inferred validated input type for a given zod schema. */
export type ToolValidatedValue<TSchema extends ToolInputSchema> = z.infer<TSchema>

/** Lifecycle of a single tool run. */
export type ToolExecutionState = "idle" | "validating" | "processing" | "success" | "error"

/** A single validation problem, consistently shaped across all tools. */
export interface ToolValidationIssue {
  /** Dot-path of the offending field, e.g. "input" or "options.limit". */
  field: string
  /** Human-readable message. Never a stack trace. */
  message: string
}

/** Result of running a tool's input schema against raw input. */
export interface ToolValidationResult {
  ok: boolean
  issues: ToolValidationIssue[]
}

/** Timing + outcome facts recorded for one run. */
export interface ToolExecutionMetrics {
  /** Time spent parsing/validating input (ms). */
  validationMs: number
  /** Time spent in the tool's processing logic (ms). */
  processingMs: number
  /** Monotonic timestamp (ms) when the run started. */
  startedAt: number
}

/** Everything a tool's process function needs. */
export interface ToolContext {
  toolId: string
  /** Monotonic ms timestamp at the start of processing. */
  startedAt: number
}

/** Processing logic. May be sync or async; may throw (mapped to ToolError). */
export type ToolProcessor<TSchema extends ToolInputSchema, TOutput extends ToolOutput> = (
  input: z.infer<TSchema>,
  context: ToolContext
) => TOutput | Promise<TOutput>

/** Successful outcome of `ToolEngine.run`. */
export interface ToolRunResult<TOutput extends ToolOutput> {
  /** The validated, processed output value. */
  output: TOutput
  metrics: ToolExecutionMetrics
  /** Uniquely identifies this run (used for history/link sharing). */
  runId: string
}

/** Summary hooks so history stays human-readable without storing raw payloads. */
export interface ToolSummarizer<TInput, TOutput> {
  /** Stable one-line snapshot of what was given to the tool. */
  input?: (value: TInput) => string
  /** Stable one-line snapshot of what the tool produced. */
  output?: (value: TOutput) => string
}

/** Everything a tool declares to the engine. */
export interface ToolEngineConfig<TSchema extends ToolInputSchema, TOutput extends ToolOutput> {
  /** Identifier shared with the manifest slug, e.g. "json-formatter". */
  toolId: string
  /** Zod schema that validates raw input. */
  schema: TSchema
  /** Optional: coerce raw input (e.g. trimming) before schema validation. */
  normalize?: (raw: ToolInput) => ToolInput
  /** The tool's actual logic. */
  process: ToolProcessor<TSchema, TOutput>
  /** History summaries (input/output) for the entry log. */
  summarize?: ToolSummarizer<z.infer<TSchema>, TOutput>
}

/** The reusable engine every tool (or its hook) drives. */
export interface ToolEngine<TSchema extends ToolInputSchema, TOutput extends ToolOutput> {
  toolId: string
  schema: TSchema
  /** History summaries (input/output) declared by the tool itself. */
  summarize?: ToolSummarizer<z.infer<TSchema>, TOutput>
  /** Validate only — no side effects. */
  validate(raw: ToolInput): ToolValidationResult
  /** Full pipeline: normalize → validate → process → measure. Throws ToolExecutionError. */
  run(raw: ToolInput, options?: ToolRunOptions<TOutput>): Promise<ToolRunResult<TOutput>>
}

export interface ToolRunOptions<TOutput extends ToolOutput = ToolOutput> {
  /** Streams pipeline phase changes so hooks can reflect state. */
  onPhase?: (phase: "validating" | "processing") => void
  /** Executed when a run succeeds, before resolution (e.g. history push). */
  onSuccess?: (result: ToolRunResult<TOutput>) => void
  /** Executed when a run fails (validation or processing). */
  onError?: (error: ToolExecutionError) => void
}

/** Codes every tool can surface; UI maps them to friendly copy. */
export type ToolErrorCode =
  "VALIDATION" | "PROCESSING" | "NOT_SUPPORTED" | "FILE_TOO_LARGE" | "UNKNOWN"

/** Application-level error thrown by the engine. A value, never a stack trace. */
export class ToolExecutionError extends Error {
  readonly code: ToolErrorCode
  readonly issues: ToolValidationIssue[]
  readonly cause?: unknown

  constructor(
    code: ToolErrorCode,
    message: string,
    issues: ToolValidationIssue[] = [],
    cause?: unknown
  ) {
    super(message)
    this.name = "ToolExecutionError"
    this.code = code
    this.issues = issues
    this.cause = cause
  }

  /** User-safe message; suitable for toast and error regions. */
  toUserMessage(): string {
    return this.message
  }
}
