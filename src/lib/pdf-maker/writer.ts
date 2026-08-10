/**
 * Minimal, dependency-free PDF writer.
 *
 * Produces a correct, readable PDF for text documents: base-14 Helvetica
 * fonts (zero embedded font bytes), explicit xref table, trailer with
 * Info dictionary. Text is encoded in WinAnsi/cp1252 — anything outside
 * that repertoire is replaced with `?` and counted, so callers never
 * claim Unicode coverage they didn't deliver. The assembly is
 * byte-level (never ascii), so identical inputs produce identical
 * bytes, which keeps tests deterministic.
 */

import { layoutText, PAGE_SIZES, type PdfPageSize } from "./layout"
import { encodeWinAnsi, escapePdfString } from "./winansi"

export interface CreateTextPdfInput {
  text: string
  title?: string | null
  pageSize?: PdfPageSize
  /** Point size of the body font. */
  fontSize?: number
  /** Line spacing multiplier (1 = single). */
  lineHeight?: number
  /** Margins in millimetres, applied on all four edges. */
  marginsMm?: number
  /** Fixed timestamp — pass a Date for deterministic tests. */
  createdAt?: Date
}

export interface CreateTextPdfResult {
  bytes: Uint8Array
  /** Number of pages in the produced file. */
  pages: number
  /** Characters outside WinAnsi that were replaced with `?`. */
  droppedCharacters: number
}

/** PDF date literal, e.g. `D:20260808123456`. */
export function formatPdfDate(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, "0")
  return `D:${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(
    date.getUTCDate()
  )}${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}`
}

const FONT_BODY = "/F1"
const FONT_TITLE = "/F2"

export function createTextPdf(input: CreateTextPdfInput): CreateTextPdfResult {
  const pageSize = input.pageSize ?? "a4"
  const fontSize = input.fontSize ?? 12
  const lineHeight = input.lineHeight ?? 1.4
  const marginsMm = input.marginsMm ?? 25
  const title = input.title?.trim() || null
  const createdAt = input.createdAt ?? new Date()

  const { pages: laidOut } = layoutText({
    text: input.text,
    pageSize,
    fontSize,
    lineHeight,
    marginsMm,
    title,
  })

  const { width, height } = PAGE_SIZES[pageSize]
  const marginPt = (marginsMm * 72) / 25.4
  const linePt = fontSize * lineHeight
  const titleLinePt = title ? fontSize * 1.4 : 0

  const toBytes = (text: string): number[] => [...new TextEncoder().encode(text)]

  /** Content stream for one page: absolute-positioned text runs. */
  let droppedCharacters = 0
  const contentStreams: number[][] = laidOut.map((page) => {
    let baseline = height - marginPt - fontSize
    const stream: number[] = [...toBytes("BT\n")]
    for (const line of page.lines) {
      const font = line.bold ? FONT_TITLE : FONT_BODY
      const size = line.bold ? Math.round(fontSize * 1.3 * 100) / 100 : fontSize
      stream.push(
        ...toBytes(`${font} ${size} Tf\n1 0 0 1 ${marginPt} ${baseline.toFixed(2)} Tm\n(`)
      )
      const encoded = encodeWinAnsi(line.text)
      droppedCharacters += encoded.replaced
      stream.push(...encoded.bytes)
      stream.push(...toBytes(") Tj\n"))
      baseline -= line.bold ? titleLinePt : linePt
    }
    stream.push(...toBytes("ET"))
    return stream
  })

  const pageStart = 3
  const numObjects = pageStart + laidOut.length * 2 + 2 + 1 // pages, streams, fonts, info
  const offsets = new Array<number>(numObjects + 1).fill(0)

  const out: number[] = []
  const push = (value: string | number[]) => {
    out.push(...(typeof value === "string" ? toBytes(value) : value))
  }

  push("%PDF-1.4\n")

  const pageRefs: number[] = []
  for (let index = 0; index < laidOut.length; index += 1) pageRefs.push(pageStart + index * 2)
  const fontBodyRef = pageStart + laidOut.length * 2
  const fontTitleRef = fontBodyRef + 1
  const infoRef = fontTitleRef + 1

  const writeObject = (ref: number, body: string) => {
    offsets[ref] = out.length
    push(`${ref} 0 obj\n${body}\nendobj\n`)
  }

  writeObject(1, "<< /Type /Catalog /Pages 2 0 R >>")
  writeObject(
    2,
    `<< /Type /Pages /Kids [${pageRefs.map((ref) => `${ref} 0 R`).join(" ")}] /Count ${laidOut.length} >>`
  )

  laidOut.forEach((_page, index) => {
    const pageRef = pageStart + index * 2
    const contentRef = pageRef + 1
    writeObject(
      pageRef,
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${width} ${height}] /Resources << /Font << /F1 ${fontBodyRef} 0 R /F2 ${fontTitleRef} 0 R >> >> /Contents ${contentRef} 0 R >>`
    )
    offsets[contentRef] = out.length
    push(`${contentRef} 0 obj\n<< /Length ${contentStreams[index].length} >>\nstream\n`)
    push(contentStreams[index])
    push("\nendstream\nendobj\n")
  })

  writeObject(fontBodyRef, "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>")
  writeObject(fontTitleRef, "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>")

  const infoBody = [
    title ? `/Title (${escapePdfString(title)})` : null,
    "/Producer (NEXUS Tools)",
    "/Creator (NEXUS Tools)",
    `/CreationDate (${formatPdfDate(createdAt)})`,
    `/ModDate (${formatPdfDate(createdAt)})`,
  ]
    .filter(Boolean)
    .join("\n")
  writeObject(infoRef, `<<\n${infoBody}\n>>`)

  const xrefStart = out.length
  push(`xref\n0 ${numObjects + 1}\n0000000000 65535 f \n`)
  for (let ref = 1; ref <= numObjects; ref += 1) {
    push(`${String(offsets[ref]).padStart(10, "0")} 00000 n \n`)
  }
  push(
    `trailer\n<< /Size ${numObjects + 1} /Root 1 0 R /Info ${infoRef} 0 R >>\nstartxref\n${xrefStart}\n%%EOF`
  )

  return {
    bytes: new Uint8Array(out),
    pages: laidOut.length,
    droppedCharacters,
  }
}
