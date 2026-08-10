/**
 * Pure text layout for the text-to-PDF writer.
 *
 * Two stages, both deterministic and unit-tested:
 *  1. Wrap source text into lines that fit the printable width.
 *  2. Paginate lines onto pages that fit the printable height.
 *
 * No React, no canvas — line width is measured with the embedded
 * Helvetica width table, so results are identical in tests and in the
 * browser. Long words are hard-broken instead of overflowing.
 */

import { measureWinAnsiLine } from "./widths"

export const PAGE_SIZES = {
  a4: { width: 595.28, height: 841.89 },
  letter: { width: 612, height: 792 },
} as const

export type PdfPageSize = keyof typeof PAGE_SIZES

export interface LaidOutPage {
  lines: Array<{ text: string; bold: boolean }>
}

export interface LayoutInput {
  text: string
  pageSize: PdfPageSize
  fontSize: number
  /** Line spacing multiplier (1 = single). */
  lineHeight: number
  /** Margins in millimetres, applied on all four edges. */
  marginsMm: number
  title: string | null
}

export interface LayoutResult {
  pages: LaidOutPage[]
}

const POINTS_PER_MM = 72 / 25.4

function printableWidthPt(pageSize: PdfPageSize, marginsMm: number): number {
  return PAGE_SIZES[pageSize].width - marginsMm * POINTS_PER_MM * 2
}

/** Greedy word wrap: hard-breaks words longer than the printable width. */
export function shallowWrap(source: string, maxWidthPt: number, fontSize: number): string[] {
  const sourceLines = source.replace(/\t/g, "    ").split("\n")
  const laid: string[] = []

  for (const rawLine of sourceLines) {
    const words = rawLine.split(" ")
    let current = ""
    for (const word of words) {
      const candidate = current.length === 0 ? word : `${current} ${word}`
      const fits = measureWinAnsiLine(candidate, fontSize) <= maxWidthPt
      if (current.length === 0 || fits) {
        current = candidate
        continue
      }
      laid.push(current)
      let rest = word
      while (rest.length > 0 && measureWinAnsiLine(rest, fontSize) > maxWidthPt) {
        let take = rest.length
        while (take > 1 && measureWinAnsiLine(rest.slice(0, take), fontSize) > maxWidthPt) {
          take -= 1
        }
        laid.push(rest.slice(0, take))
        rest = rest.slice(take)
      }
      current = rest.length > 0 ? rest : ""
    }
    if (current.length > 0) laid.push(current)
  }
  return laid
}

/**
 * Lay the source text onto pages: wrap → paginate, dropping blank lines
 * at page tops so breaks stay clean. The optional title opens every
 * page so multi-page documents read coherently.
 */
export function layoutText(input: LayoutInput): LayoutResult {
  const { text, pageSize, fontSize, lineHeight, marginsMm, title } = input
  const maxWidthPt = printableWidthPt(pageSize, marginsMm)
  const marginPt = marginsMm * POINTS_PER_MM
  const usableHeightPt = PAGE_SIZES[pageSize].height - marginPt * 2
  const linePt = fontSize * lineHeight
  const titleLinePt = title ? fontSize * 1.4 : 0
  const bodyCapacity = Math.max(1, Math.floor((usableHeightPt - titleLinePt) / linePt))

  const wrapped = shallowWrap(text, maxWidthPt, fontSize)
  const pages: LaidOutPage[] = []

  const startPage = (): LaidOutPage => {
    const page: LaidOutPage = { lines: [] }
    if (title) page.lines.push({ text: title, bold: true })
    pages.push(page)
    return page
  }

  let page = startPage()
  const flush = () => {
    page = startPage()
  }
  const contentCount = (): number => page.lines.length - (title ? 1 : 0)

  for (const line of wrapped) {
    const trimmed = line.trim()
    if (trimmed && contentCount() >= bodyCapacity) flush()
    if (!trimmed) continue
    page.lines.push({ text: trimmed, bold: false })
  }

  return { pages }
}

export { printableWidthPt as widthPt }
