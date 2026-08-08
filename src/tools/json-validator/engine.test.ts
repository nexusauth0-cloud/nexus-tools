import { describe, expect, it } from "vitest"
import { ToolExecutionError } from "@/lib/tool-engine"
import {
  countJsonEntries,
  jsonErrorPosition,
  parseJsonWithLocation,
  positionToLineColumn,
} from "@/lib/json"
import { jsonValidatorEngine } from "./engine"

const VALID = '{\n  "name": "nexus",\n  "tags": ["a", "b"]\n}'

describe("parseJsonWithLocation", () => {
  it("parses valid JSON", () => {
    const result = parseJsonWithLocation('{"a":1}')
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.value).toEqual({ a: 1 })
  })

  it("reports line/column for positioned errors", () => {
    const result = parseJsonWithLocation('{\n  "a": 1,\n}')
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.message).toMatch(/line \d+, column \d+/)
      expect(result.line).toBeGreaterThanOrEqual(1)
      expect(result.column).toBeGreaterThanOrEqual(1)
    }
  })

  it("falls back to a plain message when positions are unavailable", () => {
    const result = parseJsonWithLocation("{oops}")
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.message).toContain("Invalid JSON")
  })
})

describe("jsonErrorPosition / positionToLineColumn", () => {
  it("extracts V8 positions", () => {
    expect(jsonErrorPosition("Unexpected token } in JSON at position 14")).toBe(14)
    expect(jsonErrorPosition("Expected property name")).toBeNull()
  })

  it("computes 1-based coordinates", () => {
    const text = "abc\ndef"
    expect(positionToLineColumn(text, 4)).toEqual({ line: 2, column: 1 })
    expect(positionToLineColumn(text, 6)).toEqual({ line: 2, column: 3 })
  })
})

describe("countJsonEntries", () => {
  it("counts objects, arrays, and scalars", () => {
    expect(countJsonEntries({ a: 1, b: 2 })).toBe(2)
    expect(countJsonEntries([1, 2, 3])).toBe(3)
    expect(countJsonEntries("scalar")).toBe(1)
  })
})

describe("jsonValidatorEngine", () => {
  it("reports valid JSON with stats", async () => {
    const result = await jsonValidatorEngine.run({ json: VALID })
    expect(result.output.valid).toBe(true)
    expect(result.output.entries).toBe(2)
    expect(result.output.bytes).toBeGreaterThan(0)
  })

  it("throws friendly, positioned VALIDATION errors", async () => {
    const error = await jsonValidatorEngine.run({ json: '{"a": 1,}' }).catch((e: unknown) => e)
    expect(error).toBeInstanceOf(ToolExecutionError)
    expect((error as ToolExecutionError).code).toBe("VALIDATION")
    expect((error as ToolExecutionError).toUserMessage()).toContain("line")
  })

  it("rejects empty input at the schema layer", async () => {
    const error = await jsonValidatorEngine.run({ json: " " }).catch((e: unknown) => e)
    expect(error).toBeInstanceOf(ToolExecutionError)
    expect((error as ToolExecutionError).code).toBe("VALIDATION")
  })

  it("accepts valid JSON without an explicit mode field", async () => {
    const input: Record<string, unknown> = { json: '{"x":1}' }
    const result = await jsonValidatorEngine.run(input)
    expect(result.output.entries).toBe(1)
  })
})
