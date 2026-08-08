/**
 * Tool history — pure logic. Keeps the append/cap/remove rules independent
 * of storage so they are testable and cloud-sync ready.
 */

export const DEFAULT_MAX_HISTORY = 10

export interface ToolHistoryEntry {
  /** Stable id for this entry (e.g. the engine run id). */
  id: string
  toolId: string
  timestamp: number
  inputSummary: string
  outputSummary: string
  durationMs: number
  status: "success" | "error"
}

/**
 * Append an entry, newest-first, deduped by id, capped at `max`.
 * Returns a new array — the store owns mutation.
 */
/** Prepare a run for storage. Timestamps are captured by the caller. */
export interface NewHistoryEntry {
  id: string
  toolId: string
  timestamp: number
  inputSummary: string
  outputSummary: string
  durationMs: number
  status: ToolHistoryEntry["status"]
}

/**
 * Append an entry, newest-first, deduped by id, capped at `max`.
 * Returns a new array — the store owns mutation.
 */
export function appendHistoryEntry(
  entries: readonly ToolHistoryEntry[],
  next: ToolHistoryEntry,
  max: number = DEFAULT_MAX_HISTORY
): ToolHistoryEntry[] {
  const withoutDuplicate = entries.filter((existing) => existing.id !== next.id)
  return [next, ...withoutDuplicate].slice(0, Math.max(0, max))
}

/** Remove a single entry by id. */
export function removeHistoryEntry(
  entries: readonly ToolHistoryEntry[],
  entryId: string
): ToolHistoryEntry[] {
  return entries.filter((entry) => entry.id !== entryId)
}

/** Keep only entries for one tool, newest first. */
export function entriesForTool(
  entries: readonly ToolHistoryEntry[],
  toolId: string
): ToolHistoryEntry[] {
  return entries
    .filter((entry) => entry.toolId === toolId)
    .sort((a, b) => b.timestamp - a.timestamp)
}

/** Fuzzy, short preview for summaries that should not store raw payloads. */
export function summarize(text: string, max = 96): string {
  const singleLine = text.replace(/\s+/g, " ").trim()
  if (singleLine.length <= max) return singleLine
  return `${singleLine.slice(0, max - 1).trimEnd()}…`
}
