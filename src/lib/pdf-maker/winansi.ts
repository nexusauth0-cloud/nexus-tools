/**
 * WinAnsi (cp1252) text encoding for the base-14 PDF fonts.
 *
 * The base-14 fonts are guaranteed to exist in every PDF reader and cost
 * zero bytes to embed, but they only cover the WinAnsi repertoire. This
 * encoder maps Unicode code points that WinAnsi can express and replaces
 * everything else with `?`, counting replacements so callers can be
 * honest about what they produced. The output is the raw byte sequence
 * that embeds verbatim into PDF literal strings.
 */

export interface WinAnsiEncodeResult {
  /** WinAnsi byte codes; chars > U+7F become their cp1252 byte. */
  bytes: number[]
  /** Characters that could not be represented and were replaced. */
  replaced: number
}

/** Escape a string for use inside PDF literal strings. */
export function escapePdfString(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)")
}

/** cp1252 byte → original Unicode code point for the control range. */
const FROM_SPECIAL: ReadonlyMap<number, number> = new Map([
  [0x80, 0x20ac], // €
  [0x82, 0x201a], // ‚
  [0x83, 0x0192], // ƒ
  [0x84, 0x201e], // „
  [0x85, 0x2026], // …
  [0x86, 0x2020], // †
  [0x87, 0x2021], // ‡
  [0x88, 0x02c6], // ˆ
  [0x89, 0x2030], // ‰
  [0x8a, 0x0160], // Š
  [0x8b, 0x2039], // ‹
  [0x8c, 0x0152], // Œ
  [0x8e, 0x017d], // Ž
  [0x91, 0x2018], // '
  [0x92, 0x2019], // '
  [0x93, 0x201c], // "
  [0x94, 0x201d], // "
  [0x95, 0x2022], // •
  [0x96, 0x2013], // –
  [0x97, 0x2014], // —
  [0x98, 0x02dc], // ˜
  [0x99, 0x2122], // ™
  [0x9a, 0x0161], // š
  [0x9b, 0x203a], // ›
  [0x9c, 0x0153], // œ
  [0x9e, 0x017e], // ž
  [0x9f, 0x0178], // Ÿ
])

/** Unicode → cp1252 byte (reverse of FROM_SPECIAL). */
const TO_SPECIAL: ReadonlyMap<number, number> = new Map(
  Array.from(FROM_SPECIAL.entries()).map(([byte, unicode]) => [unicode, byte])
)

/** True whenever `charCode` is representable in WinAnsi. */
export function isWinAnsi(charCode: number): boolean {
  if (charCode <= 0x7f) {
    return charCode === 0x09 || charCode === 0x0a || charCode === 0x0d || charCode >= 0x20
  }
  if (charCode >= 0xa0 && charCode <= 0xff) return true
  return TO_SPECIAL.has(charCode)
}

/** Maps `charCode` to its WinAnsi byte; null when unsupported. */
export function toWinAnsiByte(charCode: number): number | null {
  if (charCode <= 0x7f) return isWinAnsi(charCode) ? charCode : null
  if (charCode >= 0xa0 && charCode <= 0xff) return charCode
  return TO_SPECIAL.get(charCode) ?? null
}

export function encodeWinAnsi(text: string): WinAnsiEncodeResult {
  const bytes: number[] = []
  let replaced = 0
  for (const char of text) {
    const codePoint = char.codePointAt(0)
    if (codePoint === undefined) continue
    const byte = toWinAnsiByte(codePoint)
    if (byte === null) {
      bytes.push(0x3f) // '?'
      replaced += 1
    } else {
      bytes.push(byte)
    }
  }
  return { bytes, replaced }
}

/** Decode cp1252 bytes back to a JS string (mirror of the encoder). */
export function decodeWinAnsi(bytes: Iterable<number>): string {
  let out = ""
  for (const byte of bytes) {
    out += String.fromCodePoint(FROM_SPECIAL.get(byte) ?? byte)
  }
  return out
}
