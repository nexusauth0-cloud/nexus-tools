import { describe, expect, it } from "vitest"
import { pdfToTextEngine, NOT_FOUND_TEXT_MESSAGE } from "./engine"
import {
  titledPdfBytes,
  multiPagePdfBytes,
  emptyTextPdfBytes,
  truncatedPdfBytes,
  minimalPdfBytes,
} from "@/lib/pdf/testing/fixtures"

describe("pdfToTextEngine", () => {
  it("extracts extractable text", async () => {
    const bytes = titledPdfBytes()
    const result = await pdfToTextEngine.run({ bytes, bytesLength: bytes.length })
    expect(result.output.foundText).toBe(true)
    expect(result.output.text).toContain("quick brown fox")
    expect(result.output.characters).toBeGreaterThan(0)
    expect(result.output.words).toBeGreaterThan(0)
  })

  it("extracts text across multiple pages preserving boundaries", async () => {
    const bytes = multiPagePdfBytes()
    const result = await pdfToTextEngine.run({ bytes, bytesLength: bytes.length })
    expect(result.output.pageCount).toBe(3)
    expect(result.output.pages).toHaveLength(3)
    expect(result.output.text).toContain("First page")
    expect(result.output.text).toContain("Third page")
  })

  it("flags image-only PDFs with the OCR disclaimer instead of a silent empty result", async () => {
    const bytes = emptyTextPdfBytes()
    const result = await pdfToTextEngine.run({ bytes, bytesLength: bytes.length })
    expect(result.output.foundText).toBe(false)
    expect(result.output.text).toBe("")
    expect(NOT_FOUND_TEXT_MESSAGE).toContain("require OCR")
  })

  it("rejects malformed PDFs", async () => {
    const bytes = truncatedPdfBytes()
    await expect(pdfToTextEngine.run({ bytes, bytesLength: bytes.length })).rejects.toMatchObject({
      code: "VALIDATION",
    })
  })

  it("handles encrypted PDFs as unsupported", async () => {
    const bytes = minimalPdfBytes({ encrypted: true, pageTexts: ["Secret"] })
    await expect(pdfToTextEngine.run({ bytes, bytesLength: bytes.length })).rejects.toMatchObject({
      code: "NOT_SUPPORTED",
    })
  })
})
