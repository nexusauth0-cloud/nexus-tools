import { beforeEach, describe, expect, it } from "vitest"
import {
  normalizeSearchQuery,
  queriesEqual,
  SEARCH_HISTORY_LIMIT,
  useSearchHistoryStore,
} from "./search-history-store"

describe("search history store", () => {
  beforeEach(() => {
    useSearchHistoryStore.setState({ queries: [] })
  })

  it("records a query most-recently-first", () => {
    const { addQuery } = useSearchHistoryStore.getState()
    addQuery("json")
    addQuery("base64")
    expect(useSearchHistoryStore.getState().queries).toEqual(["base64", "json"])
  })

  it("ignores empty and whitespace-only queries", () => {
    const { addQuery } = useSearchHistoryStore.getState()
    addQuery("")
    addQuery("   ")
    expect(useSearchHistoryStore.getState().queries).toEqual([])
  })

  it("deduplicates case-insensitively and moves to front", () => {
    const { addQuery } = useSearchHistoryStore.getState()
    addQuery("JSON")
    addQuery("base64")
    addQuery("json")
    expect(useSearchHistoryStore.getState().queries).toEqual(["json", "base64"])
  })

  it("caps history at 5 with oldest dropped", () => {
    const { addQuery } = useSearchHistoryStore.getState()
    for (const q of ["a", "b", "c", "d", "e", "f"]) addQuery(q)
    const queries = useSearchHistoryStore.getState().queries
    expect(queries).toHaveLength(SEARCH_HISTORY_LIMIT)
    expect(queries).toEqual(["f", "e", "d", "c", "b"])
    expect(queries).not.toContain("a")
  })

  it("removes a single query by value (case-insensitive)", () => {
    const { addQuery, removeQuery } = useSearchHistoryStore.getState()
    addQuery("a")
    addQuery("b")
    addQuery("c")
    removeQuery("B")
    expect(useSearchHistoryStore.getState().queries).toEqual(["c", "a"])
  })

  it("clears all history", () => {
    const { addQuery, clear } = useSearchHistoryStore.getState()
    addQuery("a")
    addQuery("b")
    clear()
    expect(useSearchHistoryStore.getState().queries).toEqual([])
  })

  it("starts empty by default", () => {
    expect(useSearchHistoryStore.getState().queries).toEqual([])
  })

  it("normalizes internal whitespace but preserves case", () => {
    expect(normalizeSearchQuery("  json   formatter  ")).toBe("json formatter")
    expect(normalizeSearchQuery("  JSON  ")).toBe("JSON")
  })

  it("compares queries case-insensitively", () => {
    expect(queriesEqual("Json", "JSON")).toBe(true)
    expect(queriesEqual("json", "base64")).toBe(false)
  })
})
