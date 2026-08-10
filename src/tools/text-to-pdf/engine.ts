import { z } from "zod"
import { createToolEngine, summarize, ToolExecutionError } from "@/lib/tool-engine"
import { createTextPdf } from "@/lib/pdf-maker/writer"
import type { PdfPageSize } from "@/lib/pdf-maker/layout"

/**
 * Text to PDF engine.
 *
 * Creates the document through the dependency-free writer. The bytes
 * are the tool's real output (measured, never approximated); pages and
 * dropped character counts come from the actual layout run.
 */

const PAGE_SIZES = ["a4", "letter"] as const

const schema = z.object({
  text: z.string().max(1_000_000, "That's too much text for one document."),
  title: z.string().max(200).optional(),
  pageSize: z.enum(PAGE_SIZES).default("a4"),
  fontSize: z.number().int().min(6).max(16).default(12),
  lineHeight: z.number().min(1).max(2.5).default(1.4),
  marginsMm: z.number().int().min(6).max(80).default(25),
})

export interface TextToPdfOutput {
  bytes: Uint8Array
  pages: number
  size: number
  pageSize: PdfPageSize
  droppedCharacters: number
}

export const textToPdfEngine = createToolEngine<typeof schema, TextToPdfOutput>({
  toolId: "text-to-pdf",
  schema,
  process: ({ text, title, pageSize, fontSize, lineHeight, marginsMm }) => {
    if (text.trim().length === 0) {
      throw new ToolExecutionError("VALIDATION", "The document is empty — add some text first.")
    }
    const result = createTextPdf({
      text,
      title: title?.trim() || null,
      pageSize,
      fontSize,
      lineHeight,
      marginsMm,
    })
    return {
      bytes: result.bytes,
      pages: result.pages,
      size: result.bytes.length,
      pageSize,
      droppedCharacters: result.droppedCharacters,
    }
  },
  summarize: {
    input: (value) =>
      summarize(`"${value.title ?? value.text.slice(0, 40)}" · ${value.text.length} chars`),
    output: (value) =>
      summarize(
        `${value.pages} page${value.pages === 1 ? "" : "s"} · ${formatSize(value.size)}${value.pageSize === "a4" ? " · A4" : " · Letter"}`
      ),
  },
})

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  return `${(bytes / 1024).toFixed(1)} KB`
}
