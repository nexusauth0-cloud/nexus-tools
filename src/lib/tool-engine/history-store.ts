"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"
import {
  appendHistoryEntry,
  entriesForTool,
  removeHistoryEntry,
  type ToolHistoryEntry,
} from "./history"

interface HistoryState {
  entries: ToolHistoryEntry[]
  maxPerTool: number
  add: (entry: ToolHistoryEntry) => void
  remove: (entryId: string) => void
  clearTool: (toolId: string) => void
  clearAll: () => void
  getForTool: (toolId: string) => ToolHistoryEntry[]
}

/**
 * Local tool history, persisted to localStorage. The shape is storage
 * agnostic (pure logic lives in `./history`) so a future cloud backend can
 * swap in without touching tool code.
 */
export const useHistoryStore = create<HistoryState>()(
  persist(
    (set, get) => ({
      entries: [],
      maxPerTool: 10,
      add: (entry) =>
        set((state) => {
          const otherTools = state.entries.filter((existing) => existing.toolId !== entry.toolId)
          const sameTool = appendHistoryEntry(
            state.entries.filter((existing) => existing.toolId === entry.toolId),
            entry,
            state.maxPerTool
          )
          return {
            entries: [...otherTools, ...sameTool].sort((a, b) => b.timestamp - a.timestamp),
          }
        }),
      remove: (entryId) =>
        set((state) => ({ entries: removeHistoryEntry(state.entries, entryId) })),
      clearTool: (toolId) =>
        set((state) => ({ entries: state.entries.filter((entry) => entry.toolId !== toolId) })),
      clearAll: () => set({ entries: [] }),
      getForTool: (toolId) => entriesForTool(get().entries, toolId),
    }),
    {
      name: "nexus-tool-history",
    }
  )
)
