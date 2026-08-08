"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"

/**
 * Per-tool processing metrics, computed entirely on-device.
 *
 * Tracks execution count, cumulative time, and the most recent run so any
 * tool can surface "processed N items in Xms" without an external service.
 */

export interface ToolProcessingMetrics {
  executionCount: number
  totalValidationMs: number
  totalProcessingMs: number
  lastRunAt: number
  lastDurationMs: number
}

interface MetricsState {
  tools: Record<string, ToolProcessingMetrics>
  record: (
    toolId: string,
    run: { validationMs: number; processingMs: number; startedAt: number }
  ) => void
  getFor: (toolId: string) => ToolProcessingMetrics | undefined
  reset: (toolId: string) => void
}

export const useMetricsStore = create<MetricsState>()(
  persist(
    (set, get) => ({
      tools: {},
      record: (toolId, run) =>
        set((state) => {
          const current = state.tools[toolId]
          const totalDurationMs = run.validationMs + run.processingMs
          return {
            tools: {
              ...state.tools,
              [toolId]: {
                executionCount: (current?.executionCount ?? 0) + 1,
                totalValidationMs: (current?.totalValidationMs ?? 0) + run.validationMs,
                totalProcessingMs: (current?.totalProcessingMs ?? 0) + run.processingMs,
                lastRunAt: run.startedAt,
                lastDurationMs: totalDurationMs,
              },
            },
          }
        }),
      getFor: (toolId) => get().tools[toolId],
      reset: (toolId) =>
        set((state) => {
          const next = { ...state.tools }
          delete next[toolId]
          return { tools: next }
        }),
    }),
    {
      name: "nexus-tool-metrics",
    }
  )
)
