import { describe, expect, it } from "vitest"
import { ToolExecutionError } from "@/lib/tool-engine"
import { mulberry32 } from "@/lib/text/lorem"
import { formatDuration } from "@/lib/text/stats"
import { loremIpsumEngine } from "./engine"
import { LOREM_MAX } from "@/lib/text/lorem"

describe("loremIpsumEngine", () => {
  it("generates classic-style paragraphs by default", async () => {
    const result = await loremIpsumEngine.run({})
    expect(result.output.text).toMatch(/^Lorem ipsum dolor sit amet/i)
    expect(result.output.wordCount).toBeGreaterThan(20)
  })

  it("is deterministic for the same seed", async () => {
    const first = await loremIpsumEngine.run({ seed: 42, quantity: 2 })
    const second = await loremIpsumEngine.run({ seed: 42, quantity: 2 })
    expect(first.output.text).toBe(second.output.text)
  })

  it("produces different text for different seeds", async () => {
    const first = await loremIpsumEngine.run({ seed: 1, quantity: 1 })
    const second = await loremIpsumEngine.run({ seed: 2, quantity: 1 })
    expect(first.output.text).not.toBe(second.output.text)
  })

  it("respects the requested quantity per mode", async () => {
    const paragraphs = await loremIpsumEngine.run({ mode: "paragraphs", quantity: 3, seed: 7 })
    const words = await loremIpsumEngine.run({ mode: "words", quantity: 10, seed: 7 })
    const sentences = await loremIpsumEngine.run({ mode: "sentences", quantity: 2, seed: 7 })
    expect(paragraphs.output.text.split(/\n\n/)).toHaveLength(3)
    expect(words.output.wordCount).toBe(10)
    expect(sentences.output.text.replace(/\.\s?$/, "").split(".").length).toBe(2)
  })

  it("renders markdown and html formats", async () => {
    const markdown = await loremIpsumEngine.run({
      mode: "paragraphs",
      quantity: 2,
      format: "markdown",
      seed: 8,
    })
    expect(markdown.output.text).toMatch(/^[A-Za-z]+ [^\n]+\n\n/)
    const html = await loremIpsumEngine.run({
      mode: "paragraphs",
      quantity: 2,
      format: "html",
      seed: 8,
    })
    expect(html.output.text).toMatch(/^<p>[^<]*<\/p>\n<p>[^<]*<\/p>$/)
    expect(html.output.text).not.toMatch(/<script|onerror|javascript:/i)
  })

  it("can start without the classic passage", async () => {
    const result = await loremIpsumEngine.run({ seed: 5, startWithClassic: false })
    expect(result.output.text).not.toMatch(/^Lorem ipsum/)
  })

  it("rejects quantities beyond a mode's documented maximum", async () => {
    const error = await loremIpsumEngine
      .run({ mode: "paragraphs", quantity: LOREM_MAX.paragraphs + 1 })
      .catch((e: unknown) => e)
    expect(error).toBeInstanceOf(ToolExecutionError)
    expect((error as ToolExecutionError).code).toBe("VALIDATION")
    expect((error as ToolExecutionError).issues[0].field).toBe("quantity")

    const sentences = await loremIpsumEngine
      .run({ mode: "sentences", quantity: LOREM_MAX.sentences + 1 })
      .catch((e: unknown) => e)
    expect((sentences as ToolExecutionError).code).toBe("VALIDATION")

    const words = await loremIpsumEngine
      .run({ mode: "words", quantity: LOREM_MAX.words + 1 })
      .catch((e: unknown) => e)
    expect((words as ToolExecutionError).code).toBe("VALIDATION")
  })

  it("accepts exactly the documented maximums", async () => {
    const result = await loremIpsumEngine.run({ mode: "words", quantity: LOREM_MAX.words, seed: 1 })
    expect(result.output.wordCount).toBe(LOREM_MAX.words)
  })

  it("rejects non-positive quantities", async () => {
    const error = await loremIpsumEngine.run({ quantity: 0 }).catch((e: unknown) => e)
    expect(error).toBeInstanceOf(ToolExecutionError)
    expect((error as ToolExecutionError).code).toBe("VALIDATION")
  })
})

describe("shared lorem helpers", () => {
  it("mulberry32 is deterministic and bounded", () => {
    const first = mulberry32(123)
    const second = mulberry32(123)
    for (let index = 0; index < 10; index += 1) {
      const a = first()
      const b = second()
      expect(a).toBe(b)
      expect(a).toBeGreaterThanOrEqual(0)
      expect(a).toBeLessThan(1)
    }
  })

  it("formatDuration renders compact durations", () => {
    expect(formatDuration(0)).toBe("0 s")
    expect(formatDuration(45)).toBe("45 s")
    expect(formatDuration(120)).toBe("2 min")
    expect(formatDuration(125)).toBe("2 min 5 s")
  })
})
