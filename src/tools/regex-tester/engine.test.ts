import { describe, expect, it } from "vitest"
import { compilePattern, findMatches, regexTesterEngine, supportedFlags } from "./engine"

describe("regex tester — compilePattern", () => {
  it("compiles valid patterns", () => {
    expect(compilePattern("a+", "g")).toBeInstanceOf(RegExp)
    expect(compilePattern("(?<word>\\w+)", "gu")).toBeInstanceOf(RegExp)
  })

  it("returns a readable message for invalid patterns", () => {
    const result = compilePattern("(unclosed", "g")
    expect(typeof result).toBe("string")
    if (typeof result === "string") {
      expect(result).toMatch(/unterminated|missing/i)
    }
  })
})

describe("regex tester — findMatches", () => {
  it("finds a simple match with its index", () => {
    const regex = compilePattern("cat", "g")
    expect(regex).toBeInstanceOf(RegExp)
    const matches = findMatches(regex as RegExp, "the cat sat on the mat")
    expect(matches).toHaveLength(1)
    expect(matches[0].index).toBe(4)
    expect(matches[0].text).toBe("cat")
  })

  it("finds all global matches", () => {
    const regex = compilePattern("ab", "g")
    expect(regex).toBeInstanceOf(RegExp)
    const matches = findMatches(regex as RegExp, "ab ab ab ab")
    expect(matches).toHaveLength(4)
    expect(matches.map((m) => m.index)).toEqual([0, 3, 6, 9])
  })

  it("respects case-insensitive flag", () => {
    const regex = compilePattern("hello", "gi")
    expect(regex).toBeInstanceOf(RegExp)
    const matches = findMatches(regex as RegExp, "HELLO hello Hello")
    expect(matches).toHaveLength(3)
  })

  it("respects multiline flag", () => {
    const regex = compilePattern("^bar", "gm")
    expect(regex).toBeInstanceOf(RegExp)
    const matches = findMatches(regex as RegExp, "foo\nbar\nbar")
    expect(matches).toHaveLength(2)
    expect(matches.map((m) => m.index)).toEqual([4, 8])
  })

  it("captures groups including null non-participants", () => {
    const regex = compilePattern("(a)|(b)", "g")
    expect(regex).toBeInstanceOf(RegExp)
    const matches = findMatches(regex as RegExp, "ab")
    expect(matches[0].groups).toEqual(["a", null])
    expect(matches[1].groups).toEqual([null, "b"])
  })

  it("captures named groups", () => {
    const regex = compilePattern("(?<year>\\d{4})-(?<month>\\d{2})", "g")
    expect(regex).toBeInstanceOf(RegExp)
    const matches = findMatches(regex as RegExp, "2024-07 1999-12")
    expect(matches[0].namedGroups).toEqual({ year: "2024", month: "07" })
    expect(matches[1].namedGroups).toEqual({ year: "1999", month: "12" })
  })

  it("returns no matches for non-matching input", () => {
    const regex = compilePattern("xyz", "g")
    expect(regex).toBeInstanceOf(RegExp)
    const matches = findMatches(regex as RegExp, "no match here")
    expect(matches).toHaveLength(0)
  })
})

describe("regex tester — engine", () => {
  it("runs the full pipeline and reports count", async () => {
    const result = await regexTesterEngine.run({
      pattern: "\\d+",
      flags: "g",
      input: "a1 b22 c333",
    })
    expect(result.output.matchCount).toBe(3)
    expect(result.output.matches.map((m) => m.text)).toEqual(["1", "22", "333"])
  })

  it("rejects an invalid pattern with the engine error", async () => {
    const error = await regexTesterEngine
      .run({ pattern: "[a-", flags: "g", input: "x" })
      .catch((e: unknown) => e)
    expect(error).toBeDefined()
  })

  it("reports valid flags supported by the environment", () => {
    const flags = supportedFlags()
    expect(flags).toContain("g")
    expect(flags).toContain("i")
    expect(flags).toContain("m")
    expect(flags.length).toBeGreaterThan(0)
  })
})
