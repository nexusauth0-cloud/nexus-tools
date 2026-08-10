import { describe, expect, it } from "vitest"
import { readPdfMetadata, readPdfPageCount, readPdfText, validatePdfInput } from "@/lib/pdf/reader"
import {
  titledPdfBytes,
  barePdfBytes,
  multiPagePdfBytes,
  minimalPdfBytes,
  truncatedPdfBytes,
  nonPdfBytes,
  emptyTextPdfBytes,
} from "@/lib/pdf/testing/fixtures"
import { MAX_PDF_FILE_BYTES } from "@/lib/pdf/adapter"

describe("readPdfMetadata", () => {
  it("reads all present fields", async () => {
    const meta = await readPdfMetadata(titledPdfBytes())
    expect(meta.title).toBe("Unit Test Document")
    expect(meta.author).toBe("NEXUS Tests")
    expect(meta.subject).toBe("Deterministic fixture")
    expect(meta.keywords).toContain("pdf")
    expect(meta.creator).toBe("fixture-builder")
    expect(meta.producer).toBe("NEXUS Fixtures")
    expect(meta.pageCount).toBe(1)
    expect(meta.version).toBe("1.4")
  })

  it("leaves absent fields undefined", async () => {
    const meta = await readPdfMetadata(barePdfBytes())
    expect(meta.title).toBeUndefined()
    expect(meta.author).toBeUndefined()
    expect(meta.pageCount).toBe(1)
  })

  it("counts pages of a multi-page document", async () => {
    const meta = await readPdfMetadata(multiPagePdfBytes())
    expect(meta.pageCount).toBe(3)
  })

  it("rejects an encrypted PDF without leaking internals", async () => {
    await expect(readPdfMetadata(minimalPdfBytes({ encrypted: true }))).rejects.toMatchObject({
      code: "NOT_SUPPORTED",
    })
  })

  it("rejects malformed/truncated input", async () => {
    await expect(readPdfMetadata(truncatedPdfBytes())).rejects.toMatchObject({
      code: "VALIDATION",
    })
  })
})

describe("readPdfPageCount", () => {
  it("counts a single page", async () => {
    expect(await readPdfPageCount(titledPdfBytes())).toBe(1)
  })

  it("counts multiple pages", async () => {
    expect(await readPdfPageCount(multiPagePdfBytes())).toBe(3)
  })

  it("rejects malformed input", async () => {
    await expect(readPdfPageCount(truncatedPdfBytes())).rejects.toMatchObject({
      code: "VALIDATION",
    })
  })
})

describe("readPdfText", () => {
  it("extracts text with page boundaries preserved", async () => {
    const result = await readPdfText(multiPagePdfBytes())
    expect(result.pageCount).toBe(3)
    expect(result.pages).toHaveLength(3)
    expect(result.pages[0]).toContain("First page")
    expect(result.text).toContain("Second page")
    expect(result.foundText).toBe(true)
  })

  it("reports no text for image-only pages (no OCR claim)", async () => {
    const result = await readPdfText(emptyTextPdfBytes())
    expect(result.foundText).toBe(false)
    expect(result.text).toBe("")
    expect(result.characters).toBe(0)
  })

  it("counts characters and words", async () => {
    const result = await readPdfText(titledPdfBytes())
    expect(result.characters).toBeGreaterThan(0)
    expect(result.words).toBeGreaterThan(0)
  })

  it("rejects malformed input", async () => {
    await expect(readPdfText(truncatedPdfBytes())).rejects.toMatchObject({ code: "VALIDATION" })
  })
})

describe("validatePdfInput", () => {
  it("passes valid PDFs and size checks", () => {
    expect(() => validatePdfInput(titledPdfBytes(), titledPdfBytes().length)).not.toThrow()
  })

  it("rejects non-PDF bytes", () => {
    expect(() => validatePdfInput(nonPdfBytes(), nonPdfBytes().length)).toThrow(
      /doesn't look like a PDF/
    )
  })

  it("rejects oversized files", () => {
    const bytes = titledPdfBytes()
    expect(() => validatePdfInput(bytes, MAX_PDF_FILE_BYTES + 1)).toThrow(/limit/)
  })
})
