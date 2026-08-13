/**
 * Base64URL (RFC 4648 §5) — pure, UTF-8-safe, padding-free.
 * Used for JWT header/payload/signature sections.
 */

export function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = ""
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i])
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}

export function base64UrlToBytes(section: string): Uint8Array {
  const base64 = section.replace(/-/g, "+").replace(/_/g, "/")
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4)
  const binary = atob(padded)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

export function jsonToBase64Url(value: unknown): string {
  return bytesToBase64Url(new TextEncoder().encode(JSON.stringify(value)))
}

export function base64UrlToJson(section: string): unknown {
  const bytes = base64UrlToBytes(section)
  return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes))
}

/** RFC 4648 §5 check: only URL-safe base64 characters, no padding. */
export function isBase64Url(section: string): boolean {
  return section.length > 0 && /^[A-Za-z0-9_-]+$/.test(section)
}
