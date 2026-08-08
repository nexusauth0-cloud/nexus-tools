import { describe, expect, it } from "vitest"
import { ToolExecutionError } from "@/lib/tool-engine"
import { base64Decode, base64Encode } from "@/lib/encoding"
import { base64EncoderEngine } from "./engine"

describe("base64Encode / base64Decode", () => {
  it("round-trips ASCII", () => {
    const encoded = base64Encode("Hello, world!")
    expect(encoded).toBe("SGVsbG8sIHdvcmxkIQ==")
    expect(base64Decode(encoded)).toBe("Hello, world!")
  })

  it("handles Unicode correctly (UTF-8, not latin-1)", () => {
    expect(base64Encode("héllo wörld")).toBe("aMOpbGxvIHfDtnJsZA==")
    expect(base64Decode("aMOpbGxvIHfDtnJsZA==")).toBe("héllo wörld")
  })

  it("round-trips emoji and astral characters", () => {
    const text = "🎉 日本語 🚀"
    expect(base64Decode(base64Encode(text))).toBe(text)
  })

  it("rejects malformed input on decode", () => {
    expect(() => base64Decode("not base64!!")).toThrow(/Invalid base64/)
  })
})

describe("base64EncoderEngine", () => {
  it("encodes input by default", async () => {
    const result = await base64EncoderEngine.run({ input: "hello" })
    expect(result.output.mode).toBe("encode")
    expect(result.output.text).toBe("aGVsbG8=")
  })

  it("decodes valid base64 back to text", async () => {
    const result = await base64EncoderEngine.run({ input: "aGVsbG8=", mode: "decode" })
    expect(result.output.text).toBe("hello")
  })

  it("decodes Unicode payloads", async () => {
    const encoded = base64Encode("héllo wörld")
    const result = await base64EncoderEngine.run({ input: encoded, mode: "decode" })
    expect(result.output.text).toBe("héllo wörld")
  })

  it("surfaces a friendly VALIDATION error for bad input", async () => {
    const error = await base64EncoderEngine
      .run({ input: "!!!", mode: "decode" })
      .catch((e: unknown) => e)
    expect(error).toBeInstanceOf(ToolExecutionError)
    expect((error as ToolExecutionError).code).toBe("VALIDATION")
    expect((error as ToolExecutionError).toUserMessage()).toContain("base64")
  })

  it("accepts whitespace-padded input on decode", async () => {
    const result = await base64EncoderEngine.run({ input: " aGVsbG8= ", mode: "decode" })
    expect(result.output.text).toBe("hello")
  })
})
