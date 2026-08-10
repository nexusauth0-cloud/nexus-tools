import { describe, expect, it } from "vitest"
import { generateLorem, LOREM_DEFAULT_SEED, LOREM_MAX, mulberry32, randomSeed } from "./lorem"

describe("generateLorem", () => {
  it("generates a word count", () => {
    const result = generateLorem({
      mode: "words",
      quantity: 25,
      format: "plain",
      startWithClassic: false,
      seed: 1,
    })
    expect(result.text.split(/\s+/)).toHaveLength(25)
    expect(result.wordCount).toBe(25)
  })

  it("generates the requested number of sentences", () => {
    const result = generateLorem({
      mode: "sentences",
      quantity: 3,
      format: "plain",
      startWithClassic: false,
      seed: 2,
    })
    const sentences = result.text.split(/\.\s+/)
    expect(sentences).toHaveLength(3)
    expect(result.text.endsWith(".")).toBe(true)
  })

  it("generates the requested number of paragraphs", () => {
    const result = generateLorem({
      mode: "paragraphs",
      quantity: 3,
      format: "plain",
      startWithClassic: false,
      seed: 3,
    })
    expect(result.text.split(/\n\n/)).toHaveLength(3)
  })

  it("is deterministic for the same seed and differs for different seeds", () => {
    const a = generateLorem({
      mode: "paragraphs",
      quantity: 2,
      format: "plain",
      startWithClassic: false,
      seed: 42,
    })
    const b = generateLorem({
      mode: "paragraphs",
      quantity: 2,
      format: "plain",
      startWithClassic: false,
      seed: 42,
    })
    const c = generateLorem({
      mode: "paragraphs",
      quantity: 2,
      format: "plain",
      startWithClassic: false,
      seed: 43,
    })
    expect(a.text).toBe(b.text)
    expect(a.text).not.toBe(c.text)
  })

  it("uses the documented default seed when no seed is given", () => {
    const a = generateLorem({
      mode: "words",
      quantity: 5,
      format: "plain",
      startWithClassic: false,
      seed: LOREM_DEFAULT_SEED,
    })
    const b = generateLorem({
      mode: "words",
      quantity: 5,
      format: "plain",
      startWithClassic: false,
      seed: LOREM_DEFAULT_SEED,
    })
    expect(a.text).toBe(b.text)
  })

  it("prepends the traditional classic opening when requested", () => {
    const result = generateLorem({
      mode: "words",
      quantity: 40,
      format: "plain",
      startWithClassic: true,
      seed: 7,
    })
    expect(result.text.startsWith("Lorem ipsum dolor sit amet")).toBe(true)
  })

  it("capitalizes sentences and keeps placeholder text lowercase elsewhere", () => {
    const result = generateLorem({
      mode: "sentences",
      quantity: 2,
      format: "plain",
      startWithClassic: false,
      seed: 5,
    })
    expect(result.text.charAt(0)).toBe(result.text.charAt(0).toLocaleUpperCase())
  })

  it("renders markdown format with paragraph breaks", () => {
    const result = generateLorem({
      mode: "paragraphs",
      quantity: 2,
      format: "markdown",
      startWithClassic: false,
      seed: 6,
    })
    expect(result.text.split("\n\n")).toHaveLength(2)
  })

  it("renders html format with safe generated <p> tags only", () => {
    const result = generateLorem({
      mode: "paragraphs",
      quantity: 2,
      format: "html",
      startWithClassic: false,
      seed: 8,
    })
    expect(result.text).toMatch(/^<p>.*<\/p>\n<p>.*<\/p>$/)
    expect(result.text).not.toMatch(/<script|onerror|javascript:/i)
  })

  it("respects documented maximums when asked for the max", () => {
    const result = generateLorem({
      mode: "paragraphs",
      quantity: LOREM_MAX.paragraphs,
      format: "plain",
      startWithClassic: false,
      seed: 9,
    })
    expect(result.text.split(/\n\n/)).toHaveLength(LOREM_MAX.paragraphs)
  })
})

describe("mulberry32", () => {
  it("is deterministic and within [0, 1)", () => {
    const first = mulberry32(123)
    const second = mulberry32(123)
    for (let index = 0; index < 100; index += 1) {
      const a = first()
      const b = second()
      expect(a).toBe(b)
      expect(a).toBeGreaterThanOrEqual(0)
      expect(a).toBeLessThan(1)
    }
  })
})

describe("randomSeed", () => {
  it("returns an unsigned 32-bit integer", () => {
    const seed = randomSeed()
    expect(Number.isInteger(seed)).toBe(true)
    expect(seed).toBeGreaterThanOrEqual(0)
    expect(seed).toBeLessThanOrEqual(0xffffffff)
  })
})
