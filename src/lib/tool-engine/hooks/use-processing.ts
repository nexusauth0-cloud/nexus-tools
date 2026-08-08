"use client"

import { useCallback } from "react"
import type { ToolProcessingMetrics } from "../metrics-store"
import { useMetricsStore } from "../metrics-store"

export interface UseProcessingResult {
  /** Metrics for this tool, or undefined before the first run. */
  metrics: ToolProcessingMetrics | undefined
  record: (run: { validationMs: number; processingMs: number; startedAt: number }) => void
  reset: () => void
}

/** Per-tool view over the on-device processing metrics store. */
export function useProcessing(toolId: string): UseProcessingResult {
  const metrics = useMetricsStore((s) => s.tools[toolId])
  const record = useMetricsStore((s) => s.record)
  const reset = useMetricsStore((s) => s.reset)

  const recordForTool = useCallback(
    (run: { validationMs: number; processingMs: number; startedAt: number }) => record(toolId, run),
    [record, toolId]
  )

  const resetForTool = useCallback(() => reset(toolId), [reset, toolId])

  return { metrics, record: recordForTool, reset: resetForTool }
}
