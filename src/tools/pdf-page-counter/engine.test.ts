import { describe, expect, it } from "vitest"
import { pdfPageCounterEngine } from "./engine"
import {
  multiPagePdfBytes,
  titledPdfBytes,
  truncatedPdfBytes,
  minimalPdfBytes,
} from "@/lib/pdf/testing/fixtures"

describe("pdfPageCounterEngine", () => {
  it("counts a single page", async () => {
    const bytes = titledPdfBytes()
    const result = await pdfPageCounterEngine.run({ bytes, bytesLength: bytes.length })
    expect(result.output.pageCount).toBe(1)
  })

  it("counts multiple pages", async () => {
    const bytes = multiPagePdfBytes()
    const result = await pdfPageCounterEngine.run({ bytes, bytesLength: bytes.length })
    expect(result.output.pageCount).toBe(3)
  })

  it("rejects malformed PDFs", async () => {
    const bytes = truncatedPdfBytes()
    await expect(
      pdfPageCounterEngine.run({ bytes, bytesLength: bytes.length })
    ).rejects.toMatchObject({ code: "VALIDATION" })
  })

  it("records the version from the parsed header", async () => {
    const bytes = minimalPdfBytes({ pageTexts: ["Versioned"] })
    const result = await pdfPageCounterEngine.run({ bytes, bytesLength: bytes.length })
    expect(result.output.version).toBe("1.4")
  })
})
