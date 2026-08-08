import { describe, expect, it } from "vitest"
import { jsonFormatterEngine } from "./engine"

const INPUT = '{"name":"nexus","tags":["a","b"]}'

describe("jsonFormatterEngine", () => {
  it("pretty-prints with the requested indent", async () => {
    const { output } = await jsonFormatterEngine.run({ json: INPUT, mode: "pretty", indent: 2 })
    expect(output.mode).toBe("pretty")
    expect(output.text).toContain('{\n  "name"')
    expect(output.entries).toBe(2)
    expect(output.bytes).toBeGreaterThan(0)
  })

  it("minifies valid JSON", async () => {
    const { output } = await jsonFormatterEngine.run({ json: INPUT, mode: "minified", indent: 2 })
    expect(output.text).toBe(JSON.stringify(JSON.parse(INPUT)))
    expect(output.text).not.toContain("\n")
  })

  it("validates without reformatting", async () => {
    const { output } = await jsonFormatterEngine.run({ json: INPUT, mode: "validated", indent: 2 })
    expect(output.text).toBe(INPUT)
  })

  it("applies default mode and indent", async () => {
    const { output } = await jsonFormatterEngine.run({ json: INPUT })
    expect(output.mode).toBe("pretty")
    expect(output.text).toContain("  ")
  })

  it("rejects malformed JSON with a VALIDATION error", async () => {
    const error = await jsonFormatterEngine
      .run({ json: "{oops", mode: "pretty", indent: 2 })
      .catch((e: unknown) => e)
    expect(error).toMatchObject({ code: "VALIDATION" })
    expect((error as { toUserMessage(): string }).toUserMessage()).toContain("Invalid JSON")
  })

  it("rejects empty input before processing", async () => {
    const error = await jsonFormatterEngine
      .run({ json: "  ", mode: "pretty", indent: 2 })
      .catch((e: unknown) => e)
    expect(error).toMatchObject({ code: "VALIDATION" })
  })
})
