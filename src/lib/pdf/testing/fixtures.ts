/**
 * Tiny deterministic PDF fixtures, generated on the fly — nothing
 * copyrighted, nothing committed. The builder writes a minimal but
 * valid PDF: catalog, pages tree, Helvetica content, optional Info
 * dictionary, optional encryption marker, all with a correct xref.
 */

export interface MinimalPdfOptions {
  /** Content stream line(s) of text to draw per page. */
  pageTexts?: string[]
  /** Info dictionary entries, e.g. { Title: "Doc", Author: "Unit" }. */
  info?: Record<string, string>
  /** Adds a /V 1 /R 2 Standard security handler to the trailer. */
  encrypted?: boolean
}

function escapeLiteral(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)")
}

export function minimalPdfBytes(options: MinimalPdfOptions = {}): Uint8Array {
  const pageTexts = options.pageTexts ?? ["Hello from the generated fixture."]
  const info = options.info ?? {}

  const objects: string[] = []
  objects.push("<< /Type /Catalog /Pages 2 0 R >>")
  const pageRefs: number[] = []
  const kids: string[] = []
  pageTexts.forEach((_text, index) => {
    const ref = 3 + index * 2
    pageRefs.push(ref)
    kids.push(`${ref} 0 R`)
  })
  objects.push(`<< /Type /Pages /Kids [${kids.join(" ")}] /Count ${pageTexts.length} >>`)
  pageTexts.forEach((text, index) => {
    const contentRef = 3 + index * 2 + 1
    const content = text ? `BT /F1 12 Tf 72 720 Td (${escapeLiteral(text)}) Tj ET` : ""
    objects.push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents ${contentRef} 0 R >>`
    )
    objects.push(`<< /Length ${content.length} >>\nstream\n${content}\nendstream`)
  })
  objects.push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>")
  objects.push(
    `<<\n${Object.entries(info)
      .map(([key, value]) => `/${key} (${escapeLiteral(value)})`)
      .join("\n")}\n>>`
  )

  const isEncrypted = options.encrypted ?? false
  if (isEncrypted) {
    objects.push(
      "<< /Filter /Standard /V 1 /R 2 /O (00000000000000000000000000000000) /U (00000000000000000000000000000000) /P -44 >>"
    )
  }
  const infoRef = isEncrypted ? objects.length - 1 : objects.length

  let out = "%PDF-1.4\n"
  const offsets = [0]
  objects.forEach((body, index) => {
    offsets.push(out.length)
    out += `${index + 1} 0 obj\n${body}\nendobj\n`
  })

  const xrefStart = out.length
  out += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`
  for (let i = 1; i <= objects.length; i += 1) {
    out += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`
  }
  const encryptEntry = isEncrypted ? ` /Encrypt ${objects.length} 0 R` : ""
  out += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R /Info ${infoRef} 0 R${encryptEntry} >>\nstartxref\n${xrefStart}\n%%EOF`
  return new TextEncoder().encode(out)
}

/** A valid single-page PDF carrying a known title. */
export function titledPdfBytes(): Uint8Array {
  return minimalPdfBytes({
    pageTexts: ["The quick brown fox jumps over the lazy dog."],
    info: {
      Title: "Unit Test Document",
      Author: "NEXUS Tests",
      Subject: "Deterministic fixture",
      Keywords: "pdf, fixture, test",
      Creator: "fixture-builder",
      Producer: "NEXUS Fixtures",
      CreationDate: "D:20260808000000",
      ModDate: "D:20260808000000",
    },
  })
}

/** A PDF with no Info dictionary at all. */
export function barePdfBytes(): Uint8Array {
  return minimalPdfBytes({ pageTexts: ["No metadata here."] })
}

/** A multi-page PDF (3 pages, distinct lines). */
export function multiPagePdfBytes(): Uint8Array {
  return minimalPdfBytes({
    pageTexts: ["First page line.", "Second page line.", "Third page line."],
  })
}

/** A PDF whose pages contain no text operators (image-only simulation). */
export function emptyTextPdfBytes(): Uint8Array {
  return minimalPdfBytes({ pageTexts: ["", ""] })
}

/** Truncated PDF — header present, objects missing. */
export function truncatedPdfBytes(): Uint8Array {
  const full = minimalPdfBytes({ pageTexts: ["Truncated"] })
  return full.slice(0, Math.floor(full.length / 3))
}

/** Bytes that merely look non-PDF. */
export function nonPdfBytes(): Uint8Array {
  return new TextEncoder().encode("GIF89a\x01\x00\x01\x00\x00\x00\x00;")
}
