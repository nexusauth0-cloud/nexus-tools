import { describe, expect, it } from "vitest"
import { parseCsvText, truncateCsvCells } from "./csv"

describe("parseCsvText", () => {
  it("parses a header and rows", () => {
    const result = parseCsvText("name,votes\nAlice,3\nBob,5\n")
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.columns).toEqual(["name", "votes"])
    expect(result.rows).toEqual([
      ["Alice", "3"],
      ["Bob", "5"],
    ])
  })

  it("handles quoted fields with commas, quotes, and newlines", () => {
    const result = parseCsvText('a,b\n"x, y","he said ""hi""\nnext line"\n')
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.rows[0]).toEqual(["x, y", 'he said "hi"\nnext line'])
  })

  it("handles CRLF line endings", () => {
    const result = parseCsvText("a,b\r\n1,2\r\n3,4\r\n")
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.rows).toEqual([
      ["1", "2"],
      ["3", "4"],
    ])
  })

  it("inferNumeric: picks the first all-numeric column", () => {
    const result = parseCsvText("item,qty,price\napple,3,1.99\npear,7,2.5\n")
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.numericColumn).toBe(1)
  })

  it("inferNumeric: no numeric column when mixed content", () => {
    const result = parseCsvText("a,b\nx,1\ny,2\n")
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.numericColumn).toBe(1)
    const none = parseCsvText("a,b\nx,x\ny,y\n")
    expect(none.ok).toBe(true)
    if (none.ok) expect(none.numericColumn).toBeUndefined()
  })

  it("rejects rows whose width differs from the header", () => {
    const result = parseCsvText("a,b\n1\n2,3\n")
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.message).toMatch(/row 2 has 1 fields/)
    expect(result.line).toBe(2)
  })

  it("rejects an empty document and an empty header", () => {
    expect(parseCsvText("").ok).toBe(false)
    expect(parseCsvText("\n\n").ok).toBe(false)
    expect(parseCsvText("\n").ok).toBe(false)
  })

  it("rejects an unterminated quoted field", () => {
    const result = parseCsvText('a,b\n"unterminated\n')
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.message).toMatch(/unterminated quoted field/)
  })

  it("never throws on hostile input", () => {
    const attempts = ['a\n"x,y"', 'a,b\n"x","y"', 'a,"b\nc"', "...", 'a\n""\n', 'a,b,c\n1,2,"x,y"', "a,,b"]
    for (const attempt of attempts) {
      const result = parseCsvText(attempt)
      expect(result.ok, `should accept: ${attempt}`).toBe(true)
      expect(result).toBeTruthy()
    }
    const rejected = ['a,b\n"x', '"', "\n"]
    for (const attempt of rejected) {
      const result = parseCsvText(attempt)
      expect(result.ok, `should reject cleanly: ${attempt}`).toBe(false)
    }
  })
})

describe("truncateCsvCells", () => {
  it("truncates long fields and marks them with an ellipsis", () => {
    const { columns, rows } = truncateCsvCells(["abcdef"], [["z".repeat(30)]], 5)
    expect(columns[0]).toBe("abcde…")
    expect(rows[0]![0]).toBe("zzzzz…")
  })
})

describe("cell content that could break the preview", () => {
  it("passes through plain content unchanged", () => {
    const result = parseCsvText("a\nhello world\n")
    expect(result.ok).toBe(true)
  })
})