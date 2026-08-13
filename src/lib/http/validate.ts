/**
 * HTTP Request Builder validation — pure URL/method/body checks.
 *
 * The request itself is always made by the browser's fetch from the
 * client. This module only validates user input and maps failures to
 * friendly, honest error messages.
 */

export const HTTP_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"] as const
export type HttpMethod = (typeof HTTP_METHODS)[number]

export const HTTP_MAX_URL_CHARS = 8192
export const HTTP_MAX_HEADERS = 24
export const HTTP_MAX_BODY_CHARS = 512_000
export const HTTP_DEFAULT_TIMEOUT_MS = 30_000
export const HTTP_MAX_TIMEOUT_MS = 120_000

export const SAFE_HTTP_PROTOCOLS = ["http:", "https:"] as const

export class HttpRequestError extends Error {
  readonly code:
    | "MALFORMED_URL"
    | "UNSUPPORTED_PROTOCOL"
    | "INVALID_METHOD"
    | "INVALID_HEADER"
    | "INVALID_JSON_BODY"
    | "TOO_MANY_HEADERS"
    | "BODY_TOO_LARGE"
    | "URL_TOO_LONG"
    | "TIMEOUT_TOO_LARGE"
  constructor(code: HttpRequestError["code"], message: string) {
    super(message)
    this.name = "HttpRequestError"
    this.code = code
  }
}

export interface ValidatedRequest {
  url: string
  method: HttpMethod
  headers: Array<{ name: string; value: string }>
  body: string | null
  timeoutMs: number
}

export function isSupportedMethod(value: string): value is HttpMethod {
  return (HTTP_METHODS as readonly string[]).includes(value)
}

/**
 * Parse + validate a request URL. Only http/https are accepted; anything
 * else (javascript:, file:, data:, ftp:, …) is rejected before fetch runs.
 */
export function validateRequestUrl(input: string): string {
  const trimmed = input.trim()
  if (trimmed.length === 0) {
    throw new HttpRequestError("MALFORMED_URL", "Enter a request URL.")
  }
  if (trimmed.length > HTTP_MAX_URL_CHARS) {
    throw new HttpRequestError(
      "URL_TOO_LONG",
      `URL is too long (${trimmed.length} characters, max ${HTTP_MAX_URL_CHARS}).`
    )
  }

  let parsed: URL
  try {
    parsed = new URL(trimmed)
  } catch {
    throw new HttpRequestError(
      "MALFORMED_URL",
      "That is not a valid URL. Include the protocol, e.g. https://api.example.com/v1/items."
    )
  }
  if (!SAFE_HTTP_PROTOCOLS.includes(parsed.protocol as (typeof SAFE_HTTP_PROTOCOLS)[number])) {
    throw new HttpRequestError(
      "UNSUPPORTED_PROTOCOL",
      `Protocol "${parsed.protocol.slice(0, -1) || "unknown"}" is not supported. Only http:// and https:// requests are allowed.`
    )
  }
  return parsed.toString()
}

export const SENSITIVE_HEADER_NAMES = new Set([
  "authorization",
  "proxy-authorization",
  "cookie",
  "set-cookie",
  "x-api-key",
])

/** Header name normalization: lowercase for storage, original case for sending. */
export function normalizeHeaderName(name: string): string {
  return name.trim().toLowerCase()
}

/** Validate a single header name/value pair. */
export function validateHeader(name: string, value: string): void {
  const trimmedName = name.trim()
  if (trimmedName.length === 0) {
    throw new HttpRequestError("INVALID_HEADER", "Header names cannot be empty.")
  }
  if (!/^[!#$%&'*+\-.^_`|~0-9A-Za-z]+$/.test(trimmedName)) {
    throw new HttpRequestError(
      "INVALID_HEADER",
      `Header name "${trimmedName}" contains invalid characters.`
    )
  }
  if (trimmedName.length > 128) {
    throw new HttpRequestError("INVALID_HEADER", "Header names cannot exceed 128 characters.")
  }
  if (/[\r\n]/.test(value)) {
    throw new HttpRequestError(
      "INVALID_HEADER",
      `Header "${trimmedName}" contains a line break, which is not allowed.`
    )
  }
}

export function isSensitiveHeader(name: string): boolean {
  return SENSITIVE_HEADER_NAMES.has(normalizeHeaderName(name))
}

/** Validate the header list as a whole (count + per-row validation). */
export function validateHeaders(
  headers: Array<{ name: string; value: string }>
): Array<{ name: string; value: string }> {
  if (headers.length > HTTP_MAX_HEADERS) {
    throw new HttpRequestError(
      "TOO_MANY_HEADERS",
      `Too many headers (${headers.length}, max ${HTTP_MAX_HEADERS}).`
    )
  }
  const cleaned: Array<{ name: string; value: string }> = []
  for (const header of headers) {
    validateHeader(header.name, header.value)
    cleaned.push({ name: header.name.trim(), value: header.value })
  }
  return cleaned
}

export type BodyKind = "none" | "json" | "text" | "form"

/** Validate a JSON body string and return the parsed object (must be JSON data). */
export function validateJsonBody(body: string): unknown {
  const trimmed = body.trim()
  if (trimmed === "") return undefined
  try {
    return JSON.parse(trimmed)
  } catch {
    throw new HttpRequestError("INVALID_JSON_BODY", "The request body is not valid JSON.")
  }
}

/** Build the BodyInit for a body kind + raw text. */
export function buildRequestBody(kind: BodyKind, raw: string): string | null {
  if (kind === "none") return null
  if (raw.length > HTTP_MAX_BODY_CHARS) {
    throw new HttpRequestError(
      "BODY_TOO_LARGE",
      `Request body is too large (${raw.length} characters, max ${HTTP_MAX_BODY_CHARS}).`
    )
  }
  return raw
}

export function validateTimeout(timeoutMs: number): number {
  if (Number.isNaN(timeoutMs) || timeoutMs < 500) {
    throw new HttpRequestError("TIMEOUT_TOO_LARGE", "Timeout must be at least 500 ms.")
  }
  if (timeoutMs > HTTP_MAX_TIMEOUT_MS) {
    throw new HttpRequestError(
      "TIMEOUT_TOO_LARGE",
      `Timeout is too large (max ${HTTP_MAX_TIMEOUT_MS / 1000}s).`
    )
  }
  return Math.round(timeoutMs)
}
