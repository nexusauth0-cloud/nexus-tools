import { HttpMethod } from "./validate"

/**
 * Safe request history/analytics metadata.
 *
 * Persistent history and analytics may only contain these fields: method,
 * hostname, pathname, timestamp, status, duration, response size class.
 * Query strings are stripped (they can carry secrets), credentials and
 * request bodies are never stored, and response bodies never enter history.
 */

export interface SafeRequestMetadata {
  method: HttpMethod
  hostname: string
  /** Pathname only — query string intentionally stripped. */
  pathname: string
  timestamp: number
  status?: number
  durationMs?: number
  /** Size bucket of the request body sent (0 = none). */
  requestSizeBytes: number
}

export const SENSITIVE_PATH_SEGMENTS = ["admin", "password", "secret", "token", "key", "auth"]

/** Build safe metadata from a request URL. Never includes the query string. */
export function safeRequestMetadata(
  method: HttpMethod,
  url: string,
  bodySizeBytes: number,
  extra?: { status?: number; durationMs?: number }
): SafeRequestMetadata {
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    parsed = new URL("https://invalid.local/")
  }
  return {
    method,
    hostname: parsed.hostname,
    pathname: parsed.pathname,
    timestamp: Date.now(),
    status: extra?.status,
    durationMs: extra?.durationMs,
    requestSizeBytes: bodySizeBytes,
  }
}

/** One-line history summary: `GET example.com/api/items → 200 (412ms)`. */
export function summarizeRequest(meta: SafeRequestMetadata): string {
  const status = meta.status !== undefined ? ` → ${meta.status}` : ""
  const duration = meta.durationMs !== undefined ? ` (${Math.round(meta.durationMs)}ms)` : ""
  return `${meta.method} ${meta.hostname}${meta.pathname}${status}${duration}`
}

/** Whether a URL looks sensitive (heuristic; only affects history copy). */
export function urlContainsSensitiveSegment(url: string): boolean {
  const lower = url.toLowerCase()
  return SENSITIVE_PATH_SEGMENTS.some((segment) => lower.includes(segment))
}
