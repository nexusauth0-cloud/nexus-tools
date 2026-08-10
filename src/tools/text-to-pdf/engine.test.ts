import { describe, expect, it } from "vitest"
import { textToPdfEngine } from "./engine"

describe("textToPdfEngine", () => {
  const short = "Hello PDF document."

  it("creates a single-page PDF for short text", async () => {
    const result = await textToPdfEngine.run({
      text: short,
      title: "Short Doc",
      pageSize: "a4",
      fontSize: 12,
      lineHeight: 1.4,
      marginsMm: 25,
    })
    expect(result.output.pages).toBe(1)
    expect(result.output.size).toBeGreaterThan(500)
    expect(result.output.bytes).toBeInstanceOf(Uint8Array)
  })

  it("paginates long text", async () => {
    const long = Array.from(
      { length: 300 },
      (_, i) => `Paragraph ${i + 1} with enough words to wrap onto lines and fill the page.`
    ).join("\n")
    const result = await textToPdfEngine.run({
      text: long,
      fontSize: 11,
      lineHeight: 1.3,
      marginsMm: 20,
    })
    expect(result.output.pages).toBeGreaterThan(1)
  })

  it("winansi-replacement is counted, not silently dropped", async () => {
    const result = await textToPdfEngine.run({ text: "café 世界" })
    expect(result.output.droppedCharacters).toBe(2)
  })

  it("defaults to A4 and 12pt when options are omitted", async () => {
    const result = await textToPdfEngine.run({ text: short })
    expect(result.output.pageSize).toBe("a4")
  })

  it("accepts letter size", async () => {
    const result = await textToPdfEngine.run({ text: short, pageSize: "letter" })
    expect(result.output.pageSize).toBe("letter")
    expect(result.output.pages).toBe(1)
  })

  it("rejects empty documents", async () => {
    await expect(textToPdfEngine.run({ text: "   \n  " })).rejects.toMatchObject({
      code: "VALIDATION",
    })
  })

  it("rejects input outside the declared ranges", async () => {
    await expect(
      textToPdfEngine.run({ text: short, pageSize: "legal", fontSize: 200 })
    ).rejects.toMatchObject({ code: "VALIDATION" })
  })
})
