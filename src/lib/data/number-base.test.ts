import { describe, expect, it } from "vitest"
import { convertRadix } from "./number-base"

describe("convertRadix", () => {
  it("reads bare digits as decimal", () => {
    const result = convertRadix("255")
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.reason).toBe("dec")
    expect(result.decimal).toBe(255)
    expect(result.values![10]).toBe("255")
    expect(result.values![16]).toBe("ff")
    expect(result.values![2]).toBe("11111111")
  })

  it("forces hex when letters are present", () => {
    const result = convertRadix("ff")
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.reason).toBe("letter")
    expect(result.decimal).toBe(255)
  })

  it("honors explicit 0b / 0x / 0o prefixes", () => {
    const binary = convertRadix("0b1010")
    expect(binary.ok).toBe(true)
    if (binary.ok) {
      expect(binary.decimal).toBe(10)
      expect(binary.reason).toBe("bin-prefix")
    }
    const hex = convertRadix("0xff")
    expect(hex.ok).toBe(true)
    if (hex.ok) {
      expect(hex.decimal).toBe(255)
      expect(hex.reason).toBe("hex-prefix")
    }
    const octal = convertRadix("0o17")
    expect(octal.ok).toBe(true)
    if (octal.ok) {
      expect(octal.decimal).toBe(15)
      expect(octal.reason).toBe("oct-prefix")
    }
  })

  it("handles base-36 digits", () => {
    const result = convertRadix("zz")
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.decimal).toBe(35 * 36 + 35)
  })

  it("rejects empty, puncutated, and prefixed-but-empty input", () => {
    expect(convertRadix("").ok).toBe(false)
    expect(convertRadix("12.5").ok).toBe(false)
    expect(convertRadix("1e-5").ok).toBe(false)
    expect(convertRadix("0x").ok).toBe(false)
  })

  it("rejects input too large for a safe integer", () => {
    const result = convertRadix("0xffffffffffffffffffff")
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.message).toMatch(/too large/)
  })
})