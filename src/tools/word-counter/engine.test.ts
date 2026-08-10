import { describe, expect, it } from "vitest"
import { ToolExecutionError } from "@/lib/tool-engine"
import { wordCounterEngine, WORD_COUNTER_MAX_CHARS } from "./engine"

describe("wordCounterEngine", () => {
  it("counts a plain paragraph", async () => {
    const result = await wordCounterEngine.run({ input: "the quick brown fox" })
    const { stats } = result.output
    expect(stats.words).toBe(4)
    expect(stats.characters).toBe(19)
    expect(stats.sentences).toBe(0)
    expect(stats.paragraphs).toBe(1)
    expect(stats.lines).toBe(1)
  })

  it("counts CJK ideographs as words", async () => {
    const result = await wordCounterEngine.run({ input: "中文测试" })
    expect(result.output.stats.words).toBe(4)
    expect(result.output.stats.cjkWords).toBe(4)
  })

  it("returns zeroed stats for empty input", async () => {
    const result = await wordCounterEngine.run({ input: "" })
    const { stats } = result.output
    expect(stats.words).toBe(0)
    expect(stats.characters).toBe(0)
    expect(stats.sentences).toBe(0)
    expect(stats.bytes).toBe(0)
    expect(result.output.readingTime).toBe("0 s")
  })

  it("reports reading and speaking time estimates", async () => {
    const text = Array.from({ length: 220 }, () => "word").join(" ")
    const result = await wordCounterEngine.run({ input: text })
    expect(result.output.readingTime).toBe("1 min")
    expect(result.output.speakingTime).toBe("1 min 34 s")
  })

  it("rejects input over the limit", async () => {
    const error = await wordCounterEngine
      .run({ input: "a".repeat(WORD_COUNTER_MAX_CHARS + 1) })
      .catch((e: unknown) => e)
    expect(error).toBeInstanceOf(ToolExecutionError)
    expect((error as ToolExecutionError).code).toBe("VALIDATION")
    expect((error as ToolExecutionError).issues[0].message).toContain("1000000")
  })

  it("accepts exactly the limit", async () => {
    const result = await wordCounterEngine.run({ input: "a".repeat(WORD_COUNTER_MAX_CHARS) })
    expect(result.output.stats.characters).toBe(WORD_COUNTER_MAX_CHARS)
  })
})
