import { z } from "zod"
import { createToolEngine, summarize } from "@/lib/tool-engine"
import { validatePdfInput, readPdfMetadata } from "@/lib/pdf/reader"

/**
 * PDF Page Counter engine.
 *
 * Reuses the shared reader (one parse per run) — the page count and
 * document version come back together, so nothing is parsed twice.
 */

const schema = z.object({
  bytes: z.instanceof(Uint8Array),
  bytesLength: z.number().int().nonnegative(),
})

export interface PdfPageCountOutput {
  pageCount: number
  version: string
  size: number
}

export const pdfPageCounterEngine = createToolEngine<typeof schema, PdfPageCountOutput>({
  toolId: "pdf-page-counter",
  schema,
  process: async ({ bytes, bytesLength }) => {
    validatePdfInput(bytes, bytesLength)
    const info = await readPdfMetadata(bytes)
    return { pageCount: info.pageCount, version: info.version, size: bytesLength }
  },
  summarize: {
    input: (value) => summarize(`PDF document, ${bytesLabel(value.bytesLength)}`),
    output: (value) =>
      summarize(
        `${value.pageCount} page${value.pageCount === 1 ? "" : "s"} · PDF ${value.version}`
      ),
  },
})

function bytesLabel(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
