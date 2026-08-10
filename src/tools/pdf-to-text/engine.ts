import { z } from "zod"
import { createToolEngine, summarize } from "@/lib/tool-engine"
import { validatePdfInput, readPdfText } from "@/lib/pdf/reader"

/**
 * PDF to Text engine.
 *
 * Extracts extractable text page by page. Scanned/image-only PDFs have
 * no text operators — `foundText` is false and the UI explains that
 * OCR isn't supported; an empty result is never silently reported.
 * The full text lives in the live result for preview/export; history
 * stores only the summaries (never the extracted content).
 */

const schema = z.object({
  bytes: z.instanceof(Uint8Array),
  bytesLength: z.number().int().nonnegative(),
})

export interface PdfToTextOutput {
  pageCount: number
  /** Extracted text per page (page boundaries preserved). */
  pages: string[]
  /** All pages joined with a blank line. */
  text: string
  characters: number
  words: number
  /** False when no extractable text was found (image-only/scanned). */
  foundText: boolean
}

const NOT_FOUND_TEXT_MESSAGE =
  "This PDF does not appear to contain extractable text. Scanned/image-only PDFs require OCR."

export const pdfToTextEngine = createToolEngine<typeof schema, PdfToTextOutput>({
  toolId: "pdf-to-text",
  schema,
  process: async ({ bytes, bytesLength }) => {
    validatePdfInput(bytes, bytesLength)
    const extracted = await readPdfText(bytes)
    return {
      pageCount: extracted.pageCount,
      pages: extracted.pages,
      text: extracted.text,
      characters: extracted.characters,
      words: extracted.words,
      foundText: extracted.foundText,
    }
  },
  summarize: {
    input: (value) => summarize(`PDF document, ${bytesLabel(value.bytesLength)}`),
    output: (value) =>
      value.foundText
        ? summarize(
            `${value.pageCount} page${value.pageCount === 1 ? "" : "s"} · ${value.characters} chars · ${value.words} words`
          )
        : "Scanned PDF — no extractable text",
  },
})

export { NOT_FOUND_TEXT_MESSAGE }

function bytesLabel(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
