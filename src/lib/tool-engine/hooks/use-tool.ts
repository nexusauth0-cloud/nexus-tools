"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import type { z } from "zod"
import type {
  ToolEngine,
  ToolExecutionError,
  ToolExecutionState,
  ToolInput,
  ToolInputSchema,
  ToolOutput,
  ToolRunResult,
  ToolSummarizer,
  ToolValidationIssue,
} from "../types"
import { ToolExecutionError as ToolError } from "../types"
import { GENERIC_MESSAGE } from "../errors"
import { summarize, type ToolHistoryEntry } from "../history"
import { useHistoryStore } from "../history-store"
import { useMetricsStore } from "../metrics-store"
import { trackToolRun } from "../../analytics"

export interface UseToolOptions<TSchema extends ToolInputSchema, TOutput extends ToolOutput> {
  /** History summaries so stored entries stay short and human-readable. */
  summarize?: ToolSummarizer<z.infer<TSchema>, TOutput>
  onSuccess?: (result: ToolRunResult<TOutput>) => void
  onError?: (error: ToolExecutionError) => void
}

export interface UseToolResult<TOutput extends ToolOutput> {
  status: ToolExecutionState
  result: ToolRunResult<TOutput> | null
  error: ToolExecutionError | null
  issues: ToolValidationIssue[]
  run: (raw: ToolInput) => Promise<ToolRunResult<TOutput> | null>
  reset: () => void
}

/**
 * The one hook a tool UI needs. Drives the full engine pipeline and then
 * feeds the shared side-effect stages — metrics, history, analytics —
 * without the tool implementing any of them.
 */
export function useTool<TSchema extends ToolInputSchema, TOutput extends ToolOutput>(
  engine: ToolEngine<TSchema, TOutput>,
  options: UseToolOptions<TSchema, TOutput> = {}
): UseToolResult<TOutput> {
  const [status, setStatus] = useState<ToolExecutionState>("idle")
  const [result, setResult] = useState<ToolRunResult<TOutput> | null>(null)
  const [error, setError] = useState<ToolExecutionError | null>(null)
  const [issues, setIssues] = useState<ToolValidationIssue[]>([])

  const optionsRef = useRef(options)
  useEffect(() => {
    optionsRef.current = options
  }, [options])

  const addHistory = useHistoryStore((s) => s.add)
  const recordMetrics = useMetricsStore((s) => s.record)

  const run = useCallback(
    async (raw: ToolInput): Promise<ToolRunResult<TOutput> | null> => {
      setResult(null)
      setError(null)
      setIssues([])
      setStatus("idle")

      try {
        const runResult = await engine.run(raw, {
          onPhase: (phase) => setStatus(phase === "validating" ? "validating" : "processing"),
          onSuccess: () => {
            setStatus("success")
          },
          onError: () => {
            setStatus("error")
          },
        })

        recordMetrics(engine.toolId, runResult.metrics)
        addHistory(toHistoryEntry(engine, optionsRef.current.summarize, raw, runResult))
        trackToolRun({
          slug: engine.toolId,
          ok: true,
          validationMs: runResult.metrics.validationMs,
          processingMs: runResult.metrics.processingMs,
        })
        setResult(runResult)
        optionsRef.current.onSuccess?.(runResult)
        return runResult
      } catch (thrown) {
        const mapped =
          thrown instanceof ToolError
            ? thrown
            : new ToolError("UNKNOWN", GENERIC_MESSAGE, [], thrown)
        setError(mapped)
        setIssues(mapped.issues)
        setStatus("error")
        trackToolRun({
          slug: engine.toolId,
          ok: false,
          validationMs: 0,
          processingMs: 0,
        })
        optionsRef.current.onError?.(mapped)
        return null
      }
    },
    [engine, addHistory, recordMetrics]
  )

  const reset = useCallback(() => {
    setStatus("idle")
    setResult(null)
    setError(null)
    setIssues([])
  }, [])

  return { status, result, error, issues, run, reset }
}

function toHistoryEntry<TSchema extends ToolInputSchema, TOutput extends ToolOutput>(
  engine: ToolEngine<TSchema, TOutput>,
  summarizeConfig: UseToolOptions<TSchema, TOutput>["summarize"],
  raw: ToolInput,
  runResult: ToolRunResult<TOutput>
): ToolHistoryEntry {
  const inputSummary = summarizeConfig?.input
    ? summarizeConfig.input(raw as z.infer<TSchema>)
    : summarize(JSON.stringify(raw))
  const outputSummary = summarizeConfig?.output
    ? summarizeConfig.output(runResult.output)
    : summarize(JSON.stringify(runResult.output))

  return {
    id: runResult.runId,
    toolId: engine.toolId,
    timestamp: runResult.metrics.startedAt,
    inputSummary,
    outputSummary,
    durationMs: runResult.metrics.validationMs + runResult.metrics.processingMs,
    status: "success",
  }
}
