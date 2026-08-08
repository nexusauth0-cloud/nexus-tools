/**
 * Unicode-safe encoders/decoders for the developer tools.
 *
 * All encoders are pure and throw plain `Error`s on bad input; engines
 * wrap those into `ToolExecutionError("VALIDATION")` with friendly
 * messages. Nothing here touches React or the DOM.
 */

// ---------------------------------------------------------------------------
// Base64
// ---------------------------------------------------------------------------

/** Encode text to base64 with correct Unicode handling (UTF-8 bytes). */
export function base64Encode(text: string): string {
  const bytes = new TextEncoder().encode(text)
  let binary = ""
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary)
}

/** Decode base64 back to text, accepting only well-formed input. */
export function base64Decode(value: string): string {
  try {
    const binary = atob(value.trim())
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0))
    return new TextDecoder().decode(bytes)
  } catch {
    throw new Error(
      "Invalid base64: includes characters that are not base64 alphabet, whitespace, or '='."
    )
  }
}

// ---------------------------------------------------------------------------
// URL encoding
// ---------------------------------------------------------------------------

/** Percent-encode a string for use in a URL component. */
export function urlEncode(value: string): string {
  return encodeURIComponent(value)
}

/**
 * Decode a URL component. `+` is treated as a space (form encoding) so
 * real-world query strings round-trip correctly.
 */
export function urlDecode(value: string): string {
  try {
    return decodeURIComponent(value.replace(/\+/g, "%20"))
  } catch {
    throw new Error("Invalid URL encoding: incomplete or malformed percent-escape detected.")
  }
}

// ---------------------------------------------------------------------------
// HTML entities
// ---------------------------------------------------------------------------

const HTML_ESCAPE_MAP: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
}

/** Escape the five HTML-significant characters (& < > " '). */
export function htmlEncode(value: string): string {
  return value.replace(/[&<>"']/g, (char) => HTML_ESCAPE_MAP[char] ?? char)
}

/** Numeric entity → unescaped character; returns null for non-numeric refs. */
function decodeNumericEntity(body: string): string | null {
  const match = /^#(?:x([0-9a-f]+)|(\d+))$/i.exec(body)
  if (!match) return null
  const codePoint = match[1] ? Number.parseInt(match[1], 16) : Number.parseInt(match[2], 10)
  if (!Number.isFinite(codePoint) || codePoint < 0 || codePoint > 0x10ffff) return null
  return String.fromCodePoint(codePoint)
}

const NAMED_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
}

/** Decode the five named entities plus decimal/hex numeric references. */
export function htmlDecode(value: string): string {
  return value
    .replace(/&(amp|lt|gt|quot|apos);/gi, (match, name: string) => {
      const key = name.toLowerCase()
      return key === "amp" ? match : (NAMED_ENTITIES[key] ?? match)
    })
    .replace(/&#x[0-9a-f]+;/gi, (match) => decodeNumericEntity(match.slice(1, -1)) ?? match)
    .replace(/&#\d+;/g, (match) => decodeNumericEntity(match.slice(1, -1)) ?? match)
    .replace(/&amp;/g, "&")
}
