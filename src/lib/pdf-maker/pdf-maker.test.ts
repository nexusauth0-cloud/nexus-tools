import { describe, expect, it } from "vitest"
import { encodeWinAnsi, decodeWinAnsi, escapePdfString } from "@/lib/pdf-maker/winansi"
import { measureWinAnsiLine } from "@/lib/pdf-maker/widths"
import { layoutText, PAGE_SIZES } from "@/lib/pdf-maker/layout"
import { createTextPdf, formatPdfDate } from "@/lib/pdf-maker/writer"
import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs"
import type { PDFDocumentProxy, PDFPageProxy, TextItem } from "pdfjs-dist/types/src/display/api"

const FIXED_DATE = new Date("2026-08-08T12:34:56Z")

describe("winansi encoding", () => {
  it("keeps latin-1 text intact", () => {
    const result = encodeWinAnsi("Café résumé — naïve façade")
    expect(result.replaced).toBe(0)
    expect(decodeWinAnsi(result.bytes)).toBe("Café résumé — naïve façade")
  })

  it("keeps cp1252 specials intact", () => {
    const result = encodeWinAnsi("€ — “quotes” … ™")
    expect(result.replaced).toBe(0)
    expect(decodeWinAnsi(result.bytes)).toBe("€ — “quotes” … ™")
  })

  it("replaces unsupported characters (CJK, emoji) with ? and counts them", () => {
    const result = encodeWinAnsi("héllo 世界 🙈")
    expect(result).toMatchObject({ replaced: 3 })
    expect(decodeWinAnsi(result.bytes)).toBe("héllo ?? ?")
  })

  it("escapes parentheses and backslashes before encoding", () => {
    const escaped = escapePdfString("a(b)\\c x(a)b\\z")
    expect(escaped).toBe("a\\(b\\)\\\\c x\\(a\\)b\\\\z")
    expect(decodeWinAnsi(encodeWinAnsi(escaped).bytes)).toBe(escaped)
  })
})

describe("helvetica widths", () => {
  it("measures standard 'Hello World' buffer width < narrow-heading width", () => {
    expect(measureWinAnsiLine("iiiii", 10)).toBeLessThan(measureWinAnsiLine("MMMMM", 10))
  })

  it("scales linearly with font size", () => {
    expect(measureWinAnsiLine("abc", 12)).toBeCloseTo(measureWinAnsiLine("abc", 6) * 2, 5)
  })
})

describe("text layout", () => {
  it("wraps long paragraphs across lines deterministically", () => {
    const result = layoutText({
      text: "A ".repeat(200) + "B ".repeat(200),
      pageSize: "a4",
      fontSize: 12,
      lineHeight: 1.4,
      marginsMm: 25,
      title: null,
    })
    expect(result.pages.length).toBeGreaterThanOrEqual(1)
    const firstPageWidths = result.pages[0].lines.map((line) => measureWinAnsiLine(line.text, 12))
    for (const width of firstPageWidths) {
      expect(width).toBeLessThanOrEqual(PAGE_SIZES.a4.width - 25 * (72 / 25.4) * 2 + 0.01)
    }
  })

  it("paginates a long document onto multiple pages with the title repeated", () => {
    const long =
      `Paragraph heading text.\n` +
      Array.from(
        { length: 40 },
        (_, i) => `Line number ${i + 1} with some padding words to fill the width efficiently.`
      ).join("\n")
    const result = layoutText({
      text: long,
      pageSize: "a4",
      fontSize: 12,
      lineHeight: 1.4,
      marginsMm: 25,
      title: "Repeated Heading",
    })
    expect(result.pages.length).toBeGreaterThan(1)
    for (const page of result.pages)
      expect(page.lines[0]).toEqual({ text: "Repeated Heading", bold: true })
  })

  it("page size affects pagination (letter vs a4)", () => {
    const text = "Same text for both sizes. ".repeat(200)
    const a4 = layoutText({
      text,
      pageSize: "a4",
      fontSize: 11,
      lineHeight: 1.3,
      marginsMm: 25,
      title: null,
    })
    const letter = layoutText({
      text,
      pageSize: "letter",
      fontSize: 11,
      lineHeight: 1.3,
      marginsMm: 25,
      title: null,
    })
    expect(letter.pages.length).toBeGreaterThanOrEqual(a4.pages.length)
  })

  it("hard-breaks words that are longer than the printable width", () => {
    const result = layoutText({
      text: "Supercalifragilisticexpialidocious repeated ".repeat(3),
      pageSize: "a4",
      fontSize: 14,
      lineHeight: 1.4,
      marginsMm: 25,
      title: null,
    })
    const longest = Math.max(
      ...result.pages.flatMap((p) => p.lines.map((l) => measureWinAnsiLine(l.text, 14)))
    )
    expect(longest).toBeLessThanOrEqual(PAGE_SIZES.a4.width - 50 * (72 / 25.4) + 0.01)
  })
})

describe("PDF writer", () => {
  it("produces bytes with a PDF header and valid trailer", () => {
    const { bytes } = createTextPdf({ text: "Hello, PDF.", createdAt: FIXED_DATE })
    const ascii = new TextDecoder().decode(bytes)
    expect(ascii.startsWith("%PDF-1.4")).toBe(true)
    expect(ascii).toContain("startxref")
    expect(ascii).toContain("%%EOF")
  })

  it("is deterministic for identical inputs", () => {
    const a = createTextPdf({ text: "Same text every time.", title: "T", createdAt: FIXED_DATE })
    const b = createTextPdf({ text: "Same text every time.", title: "T", createdAt: FIXED_DATE })
    expect(Buffer.from(a.bytes).equals(Buffer.from(b.bytes))).toBe(true)
    expect(a.pages).toBe(b.pages)
  })

  it("writes the info dictionary with a fixable date", () => {
    expect(formatPdfDate(FIXED_DATE)).toBe("D:20260808123456")
    const { bytes } = createTextPdf({ text: "x", title: "Doc Title", createdAt: FIXED_DATE })
    const ascii = new TextDecoder().decode(bytes)
    expect(ascii).toContain("/Title (Doc Title)")
    expect(ascii).toContain("/Producer (NEXUS Tools)")
  })

  it("counts dropped characters honestly", () => {
    const { droppedCharacters } = createTextPdf({ text: "世界 🙈 café", createdAt: FIXED_DATE })
    expect(droppedCharacters).toBe(3)
  })

  it("round-trips through pdfjs: page count, metadata, text", async () => {
    const long = [`Cover line.`, `Middle paragraph with ${"many words ".repeat(60)}`].join("\n")
    const { bytes, pages } = createTextPdf({
      text: long,
      title: "Round Trip",
      createdAt: FIXED_DATE,
    })
    const task = pdfjs.getDocument({ data: bytes.slice().buffer })
    const doc: PDFDocumentProxy = await task.promise
    expect(doc.numPages).toBe(pages)
    const meta = await doc.getMetadata()
    const info = meta.info as Record<string, string>
    expect(info.Title).toBe("Round Trip")
    expect(info.Producer).toBe("NEXUS Tools")
    const page: PDFPageProxy = await doc.getPage(1)
    const content = await page.getTextContent()
    const text = content.items.map((item) => (item as TextItem).str).join("")
    expect(text).toContain("Round Trip")
    await task.destroy()
  })

  it("a4 == letter differences are real (media box)", () => {
    const a4 = createTextPdf({ text: "x", pageSize: "a4", createdAt: FIXED_DATE })
    const letter = createTextPdf({ text: "x", pageSize: "letter", createdAt: FIXED_DATE })
    const a4Ascii = new TextDecoder().decode(a4.bytes)
    const letterAscii = new TextDecoder().decode(letter.bytes)
    expect(a4Ascii).toContain("[0 0 595.28 841.89]")
    expect(letterAscii).toContain("[0 0 612 792]")
  })
})
