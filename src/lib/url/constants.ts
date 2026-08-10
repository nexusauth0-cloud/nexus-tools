/**
 * Resource limits for the webmaster tools.
 *
 * All caps are deliberately modest: these tools are for spot-checking a
 * page or file, not for downloading a website. Every cap is enforced
 * while reading the response body — a server sending more data gets its
 * stream aborted, so memory can't blow up regardless of what a server
 * actually sends.
 *
 * - HTML analysis: 3 MB is far beyond any single page worth analyzing.
 * - robots.txt: small text by nature; 512 KB is generous.
 * - sitemaps: the XML spec allows 50 MB, but 20 MB covers every
 *   realistic check while keeping parsing fast and safe.
 * - HTTP headers: no body is ever read (stream cancelled immediately).
 */

export const MAX_HTML_BYTES = 3 * 1024 * 1024
export const MAX_ROBOTS_BYTES = 512 * 1024
export const MAX_SITEMAP_BYTES = 20 * 1024 * 1024

export const REQUEST_TIMEOUT_MS = 12_000
export const SITEMAP_TIMEOUT_MS = 15_000
export const HEADERS_TIMEOUT_MS = 10_000

/** Maximum number of parsed violations/URLs a result carries for display. */
export const MAX_SAMPLE_URLS = 25
export const MAX_VIOLATIONS = 50

/** The generic, honest CORS/unreachable copy required for all fetch tools. */
export const CORS_UNREACHABLE_MESSAGE =
  "This website does not allow browser-based cross-origin analysis. NEXUS Tools did not retrieve or proxy the page."

/** Headers the HTTP Headers checker looks for, in display order. */
export const CHECKED_HEADERS = [
  "content-type",
  "cache-control",
  "content-security-policy",
  "strict-transport-security",
  "x-content-type-options",
  "referrer-policy",
  "permissions-policy",
  "cross-origin-opener-policy",
  "cross-origin-resource-policy",
  "cross-origin-embedder-policy",
] as const
