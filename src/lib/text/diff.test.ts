import { describe, expect, it } from "vitest"
import { diffLines, splitLines } from "./diff"

describe("splitLines", () => {
  it("normalizes CRLF and drops the trailing empty segment", () => {
    expect(splitLines("a\nb")).toEqual(["a", "b"])
    expect(splitLines("a\nb\n")).toEqual(["a", "b"])
    expect(splitLines("a\r\nb\r")).toEqual(["a", "b"])
    expect(splitLines("")).toEqual([])
  })
})

describe("diffLines", () => {
  it("reports identical text as all unchanged", () => {
    const result = diffLines("one\ntwo\nthree", "one\ntwo\nthree")
    expect(result.added).toBe(0)
    expect(result.removed).toBe(0)
    expect(result.unchanged).toBe(3)
    expect(result.modifiedBlocks).toBe(0)
    expect(result.ops.every((op) => op.type === "equal")).toBe(true)
  })

  it("detects added lines", () => {
    const result = diffLines("one", "one\nnew")
    expect(result.added).toBe(1)
    expect(result.unchanged).toBe(1)
    expect(result.ops).toEqual([
      { type: "equal", line: "one" },
      { type: "insert", line: "new" },
    ])
  })

  it("detects removed lines", () => {
    const result = diffLines("one\ngone", "one")
    expect(result.removed).toBe(1)
    expect(result.ops).toEqual([
      { type: "equal", line: "one" },
      { type: "delete", line: "gone" },
    ])
  })

  it("reports changed lines as modified blocks", () => {
    const result = diffLines("old line", "new line")
    expect(result.added).toBe(1)
    expect(result.removed).toBe(1)
    expect(result.unchanged).toBe(0)
    expect(result.changed).toBe(2)
    expect(result.modifiedBlocks).toBe(1)
  })

  it("handles a mix of changes in one pass", () => {
    const result = diffLines("a\nb\nc\nd", "a\nx\nc\ne")
    expect(result.unchanged).toBe(2)
    expect(result.added).toBe(2)
    expect(result.removed).toBe(2)
  })

  it("handles empty original and empty modified", () => {
    expect(diffLines("", "a\nb").added).toBe(2)
    expect(diffLines("a\nb", "").removed).toBe(2)
    expect(diffLines("", "").ops).toHaveLength(0)
  })

  it("is deterministic", () => {
    const a = diffLines("a\nb\nc\nd\ne", "a\nx\nc\ny\ne")
    const b = diffLines("a\nb\nc\nd\ne", "a\nx\nc\ny\ne")
    expect(a.ops).toEqual(b.ops)
  })

  it("handles Unicode content as plain text", () => {
    const result = diffLines("café 👋", "café 🎉")
    expect(result.changed).toBe(2)
  })

  it("handles a large mostly-equal input efficiently", () => {
    const base = Array.from({ length: 20_000 }, (_, index) => `line ${index}`).join("\n")
    const changed = base.replace("\nline 5000\n", "\nline 5000 changed\n")
    const result = diffLines(base, changed)
    expect(result.unchanged).toBe(19_999)
    expect(result.changed).toBe(2)
  })
})
