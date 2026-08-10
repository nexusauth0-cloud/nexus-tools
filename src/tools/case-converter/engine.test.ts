import { describe, expect, it } from "vitest"
import { ToolExecutionError } from "@/lib/tool-engine"
import { caseConverterEngine, CASE_CONVERTER_MAX_CHARS } from "./engine"

describe("caseConverterEngine", () => {
  it("lowercases by default", async () => {
    const result = await caseConverterEngine.run({ input: "Hello WORLD" })
    expect(result.output.mode).toBe("lower")
    expect(result.output.text).toBe("hello world")
  })

  it("converts to CONSTANT_CASE", async () => {
    const result = await caseConverterEngine.run({ input: "hello world", mode: "constant" })
    expect(result.output.text).toBe("HELLO_WORLD")
  })

  it("converts to camelCase and PascalCase", async () => {
    const camel = await caseConverterEngine.run({ input: "hello world", mode: "camel" })
    expect(camel.output.text).toBe("helloWorld")
    const pascal = await caseConverterEngine.run({ input: "hello world", mode: "pascal" })
    expect(pascal.output.text).toBe("HelloWorld")
  })

  it("preserves non-letter characters in sentence and toggle modes", async () => {
    const sentence = await caseConverterEngine.run({ input: "hello world!", mode: "sentence" })
    expect(sentence.output.text).toBe("Hello world!")
    const toggle = await caseConverterEngine.run({ input: "HeLLo!", mode: "toggle" })
    expect(toggle.output.text).toBe("hEllO!")
  })

  it("handles empty input without errors", async () => {
    const result = await caseConverterEngine.run({ input: "", mode: "upper" })
    expect(result.output.text).toBe("")
    expect(result.output.words).toBe(0)
  })

  it("rejects input over the limit", async () => {
    const error = await caseConverterEngine
      .run({ input: "a".repeat(CASE_CONVERTER_MAX_CHARS + 1) })
      .catch((e: unknown) => e)
    expect(error).toBeInstanceOf(ToolExecutionError)
    expect((error as ToolExecutionError).code).toBe("VALIDATION")
  })

  it("rejects an unknown mode", async () => {
    const error = await caseConverterEngine
      .run({ input: "x", mode: "yelling" })
      .catch((e: unknown) => e)
    expect(error).toBeInstanceOf(ToolExecutionError)
    expect((error as ToolExecutionError).code).toBe("VALIDATION")
  })
})
