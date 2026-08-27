import { create } from "zustand"
import { persist } from "zustand/middleware"

/** Bounded in-memory limit for persisted recent search queries. */
export const SEARCH_HISTORY_LIMIT = 5

/**
 * Normalizes a query for comparison and storage: trims surrounding
 * whitespace and collapses internal runs of whitespace. Case is preserved
 * as typed (the user may search case-sensitively), but comparison is
 * case-insensitive so "JSON" and "json" dedupe to the same most-recent
 * entry.
 */
export function normalizeSearchQuery(query: string): string {
  return query.replace(/\s+/g, " ").trim()
}

/** Case-insensitive equality used for deduplication. */
export function queriesEqual(a: string, b: string): boolean {
  return a.toLowerCase() === b.toLowerCase()
}

interface SearchHistoryState {
  queries: string[]
  /**
   * Records a just-run search query. Moves an existing (case-insensitive)
   * match to the front; otherwise prepends and caps to the limit.
   * Empty / whitespace-only queries are ignored.
   */
  addQuery: (query: string) => void
  /** Removes a single query from history by value (case-insensitive). */
  removeQuery: (query: string) => void
  /** Drops all stored search history. */
  clear: () => void
}

/**
 * Persisted, bounded, local-only history of command-palette searches.
 * Stores only the plain text a user explicitly typed — no timestamps,
 * payloads, or derived data. Never sent to a server.
 */
export const useSearchHistoryStore = create<SearchHistoryState>()(
  persist(
    (set) => ({
      queries: [],
      addQuery: (query) => {
        const normalized = normalizeSearchQuery(query)
        if (normalized.length === 0) return
        set((state) => {
          const filtered = state.queries.filter((existing) => !queriesEqual(existing, normalized))
          return { queries: [normalized, ...filtered].slice(0, SEARCH_HISTORY_LIMIT) }
        })
      },
      removeQuery: (query) => {
        const normalized = normalizeSearchQuery(query)
        if (normalized.length === 0) return
        set((state) => ({
          queries: state.queries.filter((existing) => !queriesEqual(existing, normalized)),
        }))
      },
      clear: () => set({ queries: [] }),
    }),
    {
      name: "nexus-search-history",
      version: 1,
    }
  )
)
