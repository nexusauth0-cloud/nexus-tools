import { describe, expect, it } from "vitest"
import {
  DEFAULT_MAX_HISTORY,
  appendHistoryEntry,
  entriesForTool,
  removeHistoryEntry,
  summarize,
  type ToolHistoryEntry,
} from "../history"

function entry(overrides: Partial<ToolHistoryEntry> = {}): ToolHistoryEntry {
  return {
    id: "run-1",
    toolId: "json-formatter",
    timestamp: 1000,
    inputSummary: "input",
    outputSummary: "output",
    durationMs: 5,
    status: "success",
    ...overrides,
  }
}

describe("appendHistoryEntry", () => {
  it("prepends newest entries", () => {
    const first = entry({ id: "a", timestamp: 1000 })
    const second = entry({ id: "b", timestamp: 2000 })
    expect(appendHistoryEntry([first], second).map((e) => e.id)).toEqual(["b", "a"])
  })

  it("dedupes by id", () => {
    const result = appendHistoryEntry([entry({ id: "a" })], entry({ id: "a", outputSummary: "v2" }))
    expect(result).toHaveLength(1)
    expect(result[0].outputSummary).toBe("v2")
  })

  it("caps the list at the max and evicts the oldest entries", () => {
    let entries: ToolHistoryEntry[] = [entry({ id: "oldest" })]
    for (let i = 0; i < DEFAULT_MAX_HISTORY + 3; i++) {
      entries = appendHistoryEntry(entries, entry({ id: `run-${i}`, timestamp: 1000 + i }))
    }
    expect(entries).toHaveLength(DEFAULT_MAX_HISTORY)
    expect(entries[0].id).toBe(`run-${DEFAULT_MAX_HISTORY + 2}`)
    expect(entries.map((e) => e.id)).not.toContain("oldest")
  })
})

describe("removeHistoryEntry", () => {
  it("removes only the target entry", () => {
    const entries = [entry({ id: "a" }), entry({ id: "b" }), entry({ id: "c" })]
    expect(removeHistoryEntry(entries, "b").map((e) => e.id)).toEqual(["a", "c"])
  })
})

describe("entriesForTool", () => {
  it("filters by tool and sorts newest first", () => {
    const entries = [
      entry({ id: "a", toolId: "json-formatter", timestamp: 1000 }),
      entry({ id: "b", toolId: "slug-generator", timestamp: 500 }),
      entry({ id: "c", toolId: "json-formatter", timestamp: 2000 }),
    ]
    expect(entriesForTool(entries, "json-formatter").map((e) => e.id)).toEqual(["c", "a"])
  })
})

describe("summarize", () => {
  it("truncates long strings with an ellipsis", () => {
    const long = "x".repeat(120)
    const summary = summarize(long, 20)
    expect(summary.length).toBeLessThanOrEqual(20)
    expect(summary.endsWith("…")).toBe(true)
  })

  it("leaves short strings intact and collapses whitespace", () => {
    expect(summarize("  a\n  b  ", 50)).toBe("a b")
  })
})
