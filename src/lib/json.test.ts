import { describe, expect, it } from "vitest"
import { binarySafeStringify, formatJsonText, parseStrictJson, scanJsonNesting } from "./json"

describe("parseStrictJson", () => {
  it("parses a plain document", () => {
    const result = parseStrictJson('{"a": 1, "b": [true, null, "x"]}')
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value).toEqual({ a: 1, b: [true, null, "x"] })
  })

  it("rejects empty input and trailing commas", () => {
    expect(parseStrictJson("").ok).toBe(false)
    expect(parseStrictJson('{"a": 1,}').ok).toBe(false)
    expect(parseStrictJson("[1,]").ok).toBe(false)
  })

  it("rejects comments and single quotes", () => {
    expect(parseStrictJson("// comment\n1").ok).toBe(false)
    expect(parseStrictJson("{'a': 1}").ok).toBe(false)
  })

  it("rejects Infinity and NaN literals", () => {
    expect(parseStrictJson("Infinity").ok).toBe(false)
    expect(parseStrictJson("NaN").ok).toBe(false)
  })

  it("reports line/column for syntax errors", () => {
    const result = parseStrictJson('{\n  "a": 1,\n  "b": }\n}')
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.line).toBe(3)
  })

  it("rejects nesting beyond the depth cap before parsing", () => {
    const deep = "[".repeat(200) + "0" + "]".repeat(200)
    expect(scanJsonNesting(deep, 100)).toBe(false)
    expect(parseStrictJson(deep).ok).toBe(false)
    const ok = "[".repeat(50) + "0" + "]".repeat(50)
    expect(scanJsonNesting(ok, 100)).toBe(true)
  })
})

describe("formatJsonText", () => {
  it("pretty-prints with two-space indent", () => {
    const result = formatJsonText('{"a":1,"b":[1,2]}', "format")
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.output).toBe('{\n  "a": 1,\n  "b": [\n    1,\n    2\n  ]\n}')
  })

  it("minifies pretty input", () => {
    const result = formatJsonText('{\n  "a": 1\n}', "minify")
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.output).toBe('{"a":1}')
  })

  it("propagates parse errors", () => {
    expect(formatJsonText("nope", "format").ok).toBe(false)
  })
})

describe("binarySafeStringify", () => {
  it("escapes non-printable and non-ASCII characters", () => {
    const output = binarySafeStringify({ s: "héllo\nworld", n: 65_000 })
    expect(output).not.toContain("é")
    expect(output).toContain("\\u00e9")
    const roundTrip = JSON.parse(output)
    expect(roundTrip).toEqual({ s: "héllo\nworld", n: 65_000 })
  })
})
