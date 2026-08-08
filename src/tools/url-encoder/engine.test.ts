import { describe, expect, it } from "vitest"
import { ToolExecutionError } from "@/lib/tool-engine"
import { urlDecode, urlEncode } from "@/lib/encoding"
import { urlEncoderEngine } from "./engine"

describe("urlEncode / urlDecode", () => {
  it("encodes reserved and unsafe characters", () => {
    expect(urlEncode("a b&c=d?e")).toBe("a%20b%26c%3Dd%3Fe")
  })

  it("keeps unreserved characters intact", () => {
    expect(urlEncode("ABC-_.~")).toBe("ABC-_.~")
  })

  it("round-trips arbitrary text", () => {
    const value = "héllo wörld 🚀 a&b=c+d?e"
    expect(urlDecode(urlEncode(value))).toBe(value)
  })

  it("treats + as a space when decoding", () => {
    expect(urlDecode("a+b=c")).toBe("a b=c")
  })

  it("rejects malformed percent-escapes", () => {
    expect(() => urlDecode("%GG")).toThrow()
  })
})

describe("urlEncoderEngine", () => {
  it("encodes by default", async () => {
    const result = await urlEncoderEngine.run({ input: "a b" })
    expect(result.output.mode).toBe("encode")
    expect(result.output.text).toBe("a%20b")
  })

  it("decodes back to the original value", async () => {
    const result = await urlEncoderEngine.run({ input: "a%20b%26c", mode: "decode" })
    expect(result.output.text).toBe("a b&c")
  })

  it("surfaces a friendly VALIDATION error on bad escapes", async () => {
    const error = await urlEncoderEngine
      .run({ input: "%", mode: "decode" })
      .catch((e: unknown) => e)
    expect(error).toBeInstanceOf(ToolExecutionError)
    expect((error as ToolExecutionError).code).toBe("VALIDATION")
    expect((error as ToolExecutionError).toUserMessage()).toContain("URL")
  })

  it("rejects empty input before decoding", async () => {
    const error = await urlEncoderEngine.run({ input: "", mode: "decode" }).catch((e: unknown) => e)
    expect(error).toBeInstanceOf(ToolExecutionError)
  })
})
