import { z } from "zod"
import { createToolEngine, summarize } from "@/lib/tool-engine"
import { validatePdfInput, readPdfMetadata } from "@/lib/pdf/reader"
import { MAX_PDF_FILE_BYTES } from "@/lib/pdf/adapter"

/**
 * PDF Metadata Viewer engine.
 *
 * Reads the document Info dictionary through the shared PDF reader.
 * Only fields that actually exist in the file are reported — absent
 * fields stay undefined and the UI renders them as "not present".
 */

const schema = z.object({
  bytes: z.instanceof(Uint8Array),
  bytesLength: z.number().int().nonnegative(),
})

export interface PdfMetadataOutput {
  version: string
  pageCount: number
  size: number
  title?: string
  author?: string
  subject?: string
  keywords?: string
  creator?: string
  producer?: string
  creationDate?: string
  modificationDate?: string
  /** Count of fields actually present in the file. */
  entryCount: number
}

export const FIXED_FIELDS = [
  "Filename",
  "File size",
  "MIME type",
  "Page count",
  "PDF version",
] as const

export const pdfMetadataEngine = createToolEngine<typeof schema, PdfMetadataOutput>({
  toolId: "pdf-metadata",
  schema,
  process: async ({ bytes, bytesLength }) => {
    validatePdfInput(bytes, bytesLength)
    const info = await readPdfMetadata(bytes)

    const optionalFields = [
      info.title,
      info.author,
      info.subject,
      info.keywords,
      info.creator,
      info.producer,
      info.creationDate,
      info.modificationDate,
    ]
    const entryCount = optionalFields.filter((value) => value !== undefined).length + 2 // version + pageCount always present

    return {
      title: info.title,
      author: info.author,
      subject: info.subject,
      keywords: info.keywords,
      creator: info.creator,
      producer: info.producer,
      creationDate: info.creationDate,
      modificationDate: info.modificationDate,
      version: info.version,
      pageCount: info.pageCount,
      size: bytesLength,
      entryCount,
    }
  },
  summarize: {
    input: (value) => summarize(`PDF document, ${formatBytes(value.bytesLength)}`),
    output: (value) =>
      summarize(
        `${value.pageCount} page${value.pageCount === 1 ? "" : "s"} · PDF ${value.version} · ${value.entryCount} field${value.entryCount === 1 ? "" : "s"}`
      ),
  },
})

export { MAX_PDF_FILE_BYTES }

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
