"use client"

import { useMemo } from "react"
import { entriesForTool, type ToolHistoryEntry } from "../history"
import { useHistoryStore } from "../history-store"

export interface UseHistoryResult {
  /** This tool's entries, newest first. */
  entries: ToolHistoryEntry[]
  add: (entry: ToolHistoryEntry) => void
  remove: (entryId: string) => void
  clearTool: () => void
}

/** Per-tool view over the shared history store. */
export function useHistory(toolId: string): UseHistoryResult {
  const allEntries = useHistoryStore((s) => s.entries)
  const add = useHistoryStore((s) => s.add)
  const remove = useHistoryStore((s) => s.remove)
  const clearTool = useHistoryStore((s) => s.clearTool)

  const entries = useMemo(() => entriesForTool(allEntries, toolId), [allEntries, toolId])

  return {
    entries,
    add,
    remove,
    clearTool: () => clearTool(toolId),
  }
}
