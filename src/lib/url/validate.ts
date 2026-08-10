/**
 * Safe URL validation for the webmaster tools.
 *
 * Only http/https is accepted. Anything else (file:, ftp:, javascript:,
 * data:, blob:, chrome:, about:…) is rejected outright. Credentials are
 * never required (and never displayed): every helper here strips or
 * hides them before a URL is shown or stored.
 */

export interface ValidatedUrlResult {
  ok: boolean
  /** Parsed URL when valid. */
  url?: URL
  /** Short user-safe reason, e.g. "Protocol not supported". */
  reason?: string
}

const ACCEPTED_PROTOCOLS = new Set(["http:", "https:"])

/** Lower-cased protocol of the input, e.g. "javascript:" or "". */
function protocolOf(input: string): string {
  const colon = input.indexOf(":")
  return colon === -1 ? "" : input.slice(0, colon).trim().toLowerCase()
}

/** A plausible scheme prefix (letters/digits/+-.), e.g. "https" or "ftp". */
function looksLikeScheme(part: string): boolean {
  return /^[a-z][a-z0-9+.-]*$/.test(part)
}

/**
 * Strict validation gate used by every URL tool. Tolerates a missing
 * scheme by assuming https:// (common user typo), but never accepts
 * non-http(s) schemes or malformed URLs.
 */
export function validateUrl(input: string): ValidatedUrlResult {
  const candidate = input.trim()
  if (candidate.length === 0) return { ok: false, reason: "Enter a URL first." }
  if (candidate.length > 2048) return { ok: false, reason: "This URL is too long." }

  const rawProtocol = protocolOf(candidate)
  let toParse = candidate
  if (rawProtocol !== "" && !looksLikeScheme(rawProtocol)) {
    // e.g. "example.com:8080/path" — the colon is a port, not a scheme.
    toParse = `https://${candidate}`
  } else if (rawProtocol !== "" && rawProtocol !== "http" && rawProtocol !== "https") {
    return {
      ok: false,
      reason: `Protocol "${rawProtocol}:" is not supported. Only http and https are allowed.`,
    }
  } else if (rawProtocol === "") {
    toParse = `https://${candidate}`
  }

  let url: URL
  try {
    url = new URL(toParse)
  } catch {
    return { ok: false, reason: "This URL could not be parsed. Check for spaces or typos." }
  }

  if (!ACCEPTED_PROTOCOLS.has(url.protocol)) {
    return {
      ok: false,
      reason: `Protocol "${url.protocol}" is not supported. Only http and https are allowed.`,
    }
  }
  if (url.hostname.length === 0) {
    return { ok: false, reason: "This URL has no hostname." }
  }
  if (url.hostname.includes("..") || url.hostname.startsWith(".") || url.hostname.endsWith(".")) {
    return { ok: false, reason: "This URL's hostname looks malformed." }
  }

  return { ok: true, url }
}

/** The URL with any username/password stripped — safe to display. */
export function urlWithoutCredentials(url: URL): string {
  const clean = new URL(url.href)
  clean.username = ""
  clean.password = ""
  return clean.href
}

/** Hostname only (no port, path, query or credentials) — safe to log/store. */
export function hostOnly(url: URL): string {
  return url.hostname
}

/**
 * Robots.txt URL for a site: always derived from the origin, so no
 * user-supplied path, query, fragment or credential can be injected
 * into the request.
 */
export function robotsUrlFor(url: URL): URL {
  return new URL(`${url.protocol}//${url.host}/robots.txt`)
}

/**
 * True when the URL carries username/password credentials. The
 * password itself is never returned — callers only learn of presence.
 */
export function hasCredentials(url: URL): { username: boolean; password: boolean } {
  return { username: url.username.length > 0, password: url.password.length > 0 }
}

/** List of common tracking parameters the URL Parser may clean up on request. */
export const TRACKING_PARAMETERS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "fbclid",
  "gclid",
] as const
