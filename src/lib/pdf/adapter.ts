import { getDocument, type PDFDocumentProxy } from "pdfjs-dist/legacy/build/pdf.mjs"
import { ToolExecutionError } from "@/lib/tool-engine"

/**
 * Dependency rationale (documented here for the record):
 *
 * PDF parsing (page count, metadata, text extraction) is a hard problem
 * — cross-reference streams, object streams, compressed content, CID
 * fonts. Building that in-house would be a security and correctness
 * liability, so the readers share one parser: Mozilla's pdf.js
 * (`pdfjs-dist`), Apache-2.0, actively maintained, ESM with bundled
 * TypeScript types, and a first-class Web Worker so parsing happens off
 * the main thread in the browser. It is the only added PDF dependency;
 * PDF *creation* is a small dependency-free writer in `src/lib/pdf-maker`.
 * In Node (the engine test environment) it runs with its built-in fake
 * worker; in the browser the tool pages wire the real worker asset.
 *
 * Security posture: PDFs are untrusted. pdf.js never executes embedded
 * JavaScript or attaches, so a malicious file cannot break out of the
 * parser. All errors are mapped to friendly, message-string-only
 * failures — internal parser details never reach the user.
 */

export const MAX_PDF_FILE_BYTES = 25 * 1024 * 1024

export function isPasswordException(error: unknown): boolean {
  return (
    error instanceof Error &&
    (error.name === "PasswordException" || (error as { code?: number }).code === 1)
  )
}

export interface OpenPdfResult {
  doc: PDFDocumentProxy
  /** Releases the document and its worker. Always call in `finally`. */
  close: () => Promise<void>
}

/**
 * Opens a PDF document from raw bytes. Throws `ToolExecutionError`
 * with a user-safe message when the file is encrypted (NOT_SUPPORTED)
 * or unparseable (VALIDATION). Never reflects internal parser errors.
 */
export async function openPdfDocument(bytes: Uint8Array): Promise<OpenPdfResult> {
  if (bytes.length === 0) {
    throw new ToolExecutionError("VALIDATION", "This file doesn't appear to be a valid PDF.")
  }
  // Defensive copy: pdf.js may transfer the buffer to a worker.
  const data = bytes.slice().buffer
  const task = getDocument({ data, password: "" })
  try {
    const doc = await task.promise
    return { doc, close: () => task.destroy() }
  } catch (error) {
    if (isPasswordException(error)) {
      throw new ToolExecutionError(
        "NOT_SUPPORTED",
        "This PDF is password-protected, so its contents can't be read. The current tools don't support password-protected PDFs."
      )
    }
    throw new ToolExecutionError(
      "VALIDATION",
      "This file doesn't appear to be a valid, readable PDF."
    )
  }
}

/** Validates that bytes carry a PDF header at the start of the file. */
export function looksLikePdf(bytes: Uint8Array): boolean {
  if (bytes.length < 8) return false
  return (
    bytes[0] === 0x25 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x44 &&
    bytes[3] === 0x46 &&
    bytes[4] === 0x2d
  )
}
