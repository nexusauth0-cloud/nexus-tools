import { describe, expect, it } from "vitest"
import { analyzeText, formatDuration, readingTimeSeconds, speakingTimeSeconds } from "./stats"

describe("analyzeText — ASCII", () => {
  it("counts characters, words, and whitespace on a plain sentence", () => {
    const stats = analyzeText("Hello world")
    expect(stats.characters).toBe(11)
    expect(stats.charactersExcludingSpaces).toBe(10)
    expect(stats.words).toBe(2)
    expect(stats.sentences).toBe(0)
    expect(stats.paragraphs).toBe(1)
    expect(stats.lines).toBe(1)
    expect(stats.whitespace).toBe(1)
    expect(stats.bytes).toBe(11)
  })

  it("separates words by punctuation and estimates sentence boundaries", () => {
    const stats = analyzeText("Hello, world! How are you?")
    expect(stats.words).toBe(5)
    expect(stats.sentences).toBe(2)
  })

  it("keeps apostrophes and hyphens inside words", () => {
    const stats = analyzeText("Don't miss the well-known one")
    expect(stats.words).toBe(5)
  })

  it("counts paragraphs by blank-line separation", () => {
    const stats = analyzeText("first\n\nsecond\n\n\nthird")
    expect(stats.paragraphs).toBe(3)
  })

  it("counts lines without double-counting a trailing newline", () => {
    expect(analyzeText("a\nb\n").lines).toBe(2)
    expect(analyzeText("a\nb").lines).toBe(2)
    expect(analyzeText("a\nb\r\nc").lines).toBe(3)
  })

  it("counts the UTF-8 byte length", () => {
    expect(analyzeText("héllo\u00e9").bytes).toBe(8)
  })
})

describe("analyzeText — Unicode", () => {
  it("counts emoji as single characters (code points)", () => {
    const stats = analyzeText("👋😀")
    expect(stats.characters).toBe(2)
    expect(stats.bytes).toBe(8)
    expect(stats.words).toBe(0)
  })

  it("counts combining characters as distinct code points but one word", () => {
    const stats = analyzeText("e\u0301")
    expect(stats.characters).toBe(2)
    expect(stats.words).toBe(1)
    expect(stats.bytes).toBe(3)
  })

  it("counts accented words correctly", () => {
    const stats = analyzeText("café déjà vu")
    expect(stats.characters).toBe(12)
    expect(stats.words).toBe(3)
  })

  it("treats each CJK ideograph as one word", () => {
    const stats = analyzeText("中文测试")
    expect(stats.characters).toBe(4)
    expect(stats.words).toBe(4)
    expect(stats.cjkWords).toBe(4)
  })

  it("mixes CJK and latin words consistently", () => {
    const stats = analyzeText("你好 world")
    expect(stats.characters).toBe(8)
    expect(stats.words).toBe(3)
    expect(stats.cjkWords).toBe(2)
  })

  it("estimates sentences for CJK punctuation", () => {
    expect(analyzeText("你好。再见！").sentences).toBe(2)
  })
})

describe("analyzeText — empty and pathological", () => {
  it("returns zeroed stats for empty input", () => {
    const stats = analyzeText("")
    expect(stats).toEqual({
      characters: 0,
      charactersExcludingSpaces: 0,
      words: 0,
      cjkWords: 0,
      sentences: 0,
      paragraphs: 0,
      lines: 0,
      whitespace: 0,
      bytes: 0,
    })
  })

  it("handles only whitespace", () => {
    const stats = analyzeText(" \n\t")
    expect(stats.charactersExcludingSpaces).toBe(0)
    expect(stats.whitespace).toBe(3)
    expect(stats.words).toBe(0)
  })

  it("handles a large input without pathological behavior", () => {
    const big = "word ".repeat(10_000)
    const stats = analyzeText(big)
    expect(stats.words).toBe(10_000)
    expect(stats.characters).toBe(50_000)
    expect(stats.bytes).toBe(50_000)
  })
})

describe("time estimates", () => {
  it("derives reading/speaking seconds from documented rates", () => {
    expect(readingTimeSeconds(220)).toBe(60)
    expect(speakingTimeSeconds(140)).toBe(60)
    expect(readingTimeSeconds(0)).toBe(0)
  })

  it("formats durations for display", () => {
    expect(formatDuration(0)).toBe("0 s")
    expect(formatDuration(45)).toBe("45 s")
    expect(formatDuration(60)).toBe("1 min")
    expect(formatDuration(65)).toBe("1 min 5 s")
  })
})
