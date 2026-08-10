import { describe, expect, it } from "vitest"
import { pdfMetadataEngine } from "./engine"
import {
  titledPdfBytes,
  barePdfBytes,
  truncatedPdfBytes,
  minimalPdfBytes,
} from "@/lib/pdf/testing/fixtures"

describe("pdfMetadataEngine", () => {
  it("reports metadata present in the file", async () => {
    const bytes = titledPdfBytes()
    const result = await pdfMetadataEngine.run({
      bytes,
      bytesLength: bytes.length,
    })
    expect(result.output.title).toBe("Unit Test Document")
    expect(result.output.author).toBe("NEXUS Tests")
    expect(result.output.pageCount).toBe(1)
    expect(result.output.version).toBe("1.4")
    expect(result.output.size).toBe(bytes.length)
    expect(result.output.entryCount).toBeGreaterThanOrEqual(1)
  })

  it("marks absent metadata fields as undefined (not fabricated)", async () => {
    const bytes = barePdfBytes()
    const result = await pdfMetadataEngine.run({ bytes, bytesLength: bytes.length })
    expect(result.output.title).toBeUndefined()
    expect(result.output.author).toBeUndefined()
    expect(result.output.subject).toBeUndefined()
    expect(result.output.entryCount).toBe(2) // version + pageCount always present
  })

  it("rejects malformed PDFs with a friendly error", async () => {
    const bytes = truncatedPdfBytes()
    await expect(pdfMetadataEngine.run({ bytes, bytesLength: bytes.length })).rejects.toMatchObject(
      { code: "VALIDATION" }
    )
  })

  it("reports password-protected PDFs as unsupported", async () => {
    const bytes = minimalPdfBytes({ encrypted: true, pageTexts: ["Protected"] })
    await expect(pdfMetadataEngine.run({ bytes, bytesLength: bytes.length })).rejects.toMatchObject(
      {
        code: "NOT_SUPPORTED",
      }
    )
  })

  it("records processing duration in metrics", async () => {
    const bytes = titledPdfBytes()
    const result = await pdfMetadataEngine.run({ bytes, bytesLength: bytes.length })
    expect(result.metrics.processingMs).toBeGreaterThanOrEqual(0)
  })
})
