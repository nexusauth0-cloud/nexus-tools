import { ToolExecutionError } from "@/lib/tool-engine"
import { openPdfDocument, looksLikePdf, MAX_PDF_FILE_BYTES } from "./adapter"

/**
 * Shared PDF reading layer — metadata, page count, and text extraction.
 * Each exported function opens the document once and always closes it,
 * so no tool parses the same PDF twice.
 */

export interface PdfMetadataResult {
  /** PDF version reported by the parser, e.g. "1.4". */
  version: string
  pageCount: number
  title?: string
  author?: string
  subject?: string
  keywords?: string
  creator?: string
  producer?: string
  creationDate?: string
  modificationDate?: string
}

const INFO_FIELDS = ["title", "author", "subject", "keywords", "creator", "producer"] as const

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

function clean(value: unknown): string | undefined {
  if (value === null || value === undefined) return undefined
  const text = String(value).trim()
  return text.length > 0 ? text : undefined
}

/** Reads document-level metadata (title, author, dates, version…) and page count. */
export async function readPdfMetadata(bytes: Uint8Array): Promise<PdfMetadataResult> {
  const opened = await openPdfDocument(bytes)
  try {
    const { info } = await opened.doc.getMetadata()
    const result: PdfMetadataResult = {
      version: clean((info as { PDFFormatVersion?: string }).PDFFormatVersion) ?? "unknown",
      pageCount: opened.doc.numPages,
    }
    for (const field of INFO_FIELDS) {
      const raw = (info as Record<string, string>)[capitalize(field)]
      const cleaned = clean(raw)
      if (cleaned) result[field] = cleaned
    }
    const created = clean((info as Record<string, unknown>).CreationDate)
    const modified = clean((info as Record<string, unknown>).ModDate)
    if (created) result.creationDate = created
    if (modified) result.modificationDate = modified
    return result
  } finally {
    await opened.close()
  }
}

/** Reads the page count only. */
export async function readPdfPageCount(bytes: Uint8Array): Promise<number> {
  const opened = await openPdfDocument(bytes)
  try {
    return opened.doc.numPages
  } finally {
    await opened.close()
  }
}

export interface PdfTextResult {
  pageCount: number
  /** Per-page raw text; empty strings for pages without extractable text. */
  pages: string[]
  /** Pages joined with a blank line separator. */
  text: string
  /** True when at least one page contained extractable text. */
  foundText: boolean
  characters: number
  words: number
}

/** Extracts text per page, preserving page boundaries. */
export async function readPdfText(bytes: Uint8Array): Promise<PdfTextResult> {
  const opened = await openPdfDocument(bytes)
  try {
    const pages: string[] = []
    for (let pageNumber = 1; pageNumber <= opened.doc.numPages; pageNumber += 1) {
      const page = await opened.doc.getPage(pageNumber)
      const content = await page.getTextContent()
      pages.push(
        content.items.map((item) => ("str" in item ? (item as { str: string }).str : "")).join("")
      )
    }
    const text = pages
      .map((item) => item.trim())
      .filter(Boolean)
      .join("\n\n")
    const characters = text.length
    const words = text.trim().length === 0 ? 0 : text.trim().split(/\s+/).length
    return { pageCount: pages.length, pages, text, foundText: text.length > 0, characters, words }
  } finally {
    await opened.close()
  }
}

/** Coarse, cheap gate reused by the PDF tool engines before parsing. Throws user-safe errors. */
export function validatePdfInput(bytes: Uint8Array, bytesLength: number): void {
  if (bytesLength > MAX_PDF_FILE_BYTES) {
    throw new ToolExecutionError(
      "FILE_TOO_LARGE",
      `This file is larger than the ${Math.round(MAX_PDF_FILE_BYTES / (1024 * 1024))} MB limit for PDF tools.`
    )
  }
  if (!looksLikePdf(bytes)) {
    throw new ToolExecutionError("VALIDATION", "This doesn't look like a PDF file.")
  }
  if (bytes.length !== bytesLength) {
    throw new ToolExecutionError("VALIDATION", "The PDF couldn't be read fully.")
  }
}
