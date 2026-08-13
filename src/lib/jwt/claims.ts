import type { JwtAlgorithm } from "./sign"

/**
 * JWT registered claims helpers.
 *
 * Claim values are validated before signing; `exp`, `nbf`, `iat` are
 * NumericDate values (seconds since epoch). Automatic `iat` is applied only
 * when explicitly enabled — the UI must clearly surface it.
 */

export const REGISTERED_CLAIMS = ["iss", "sub", "aud", "exp", "nbf", "iat", "jti"] as const
export type RegisteredClaim = (typeof REGISTERED_CLAIMS)[number]

export interface ClaimsFormInput {
  iss?: string
  sub?: string
  aud?: string
  jti?: string
  /** Signed lifetime in seconds (exp = now + lifetime) — undefined = no exp. */
  expiresInSeconds?: number
  /** Minutes before now the token is valid from — undefined = no nbf. */
  notBeforeSeconds?: number
  /** Auto-fill iat with the current time. */
  includeIat: boolean
}

export interface ClaimsBuildResult {
  payload: Record<string, unknown>
  /** Readable breakdown of what was applied (for the UI). */
  applied: {
    exp?: number
    nbf?: number
    iat?: number
  }
}

/** Merge form claims into a payload without mutating the caller's object. */
export function buildClaims(form: ClaimsFormInput, nowSeconds: number): ClaimsBuildResult {
  const payload: Record<string, unknown> = {}
  const applied: ClaimsBuildResult["applied"] = {}

  if (form.iss !== undefined && form.iss.trim() !== "") payload.iss = form.iss.trim()
  if (form.sub !== undefined && form.sub.trim() !== "") payload.sub = form.sub.trim()
  if (form.aud !== undefined && form.aud.trim() !== "") payload.aud = form.aud.trim()
  if (form.jti !== undefined && form.jti.trim() !== "") payload.jti = form.jti.trim()

  if (form.includeIat) {
    const iat = Math.floor(nowSeconds)
    payload.iat = iat
    applied.iat = iat
  }
  if (form.expiresInSeconds !== undefined && form.expiresInSeconds > 0) {
    const exp = Math.floor(nowSeconds + form.expiresInSeconds)
    payload.exp = exp
    applied.exp = exp
  }
  if (form.notBeforeSeconds !== undefined && form.notBeforeSeconds > 0) {
    const nbf = Math.floor(nowSeconds + form.notBeforeSeconds)
    payload.nbf = nbf
    applied.nbf = nbf
  }

  return { payload, applied }
}

/** Default header for a token — the header may only add extra fields. */
export function defaultHeader(algorithm: JwtAlgorithm): Record<string, unknown> {
  return { alg: algorithm, typ: "JWT" }
}

/**
 * Validate a candidate header object for signing.
 * `alg` may never be overridden to a value that differs from the selected
 * algorithm — that would be a signature downgrade.
 */
export function validateHeaderForSigning(
  algorithm: JwtAlgorithm,
  header: unknown
): Record<string, unknown> {
  if (typeof header !== "object" || header === null || Array.isArray(header)) {
    throw new Error("Header must be a JSON object.")
  }
  const record = header as Record<string, unknown>
  if (record.alg !== undefined && record.alg !== algorithm) {
    throw new Error(`Header "alg" must match the selected algorithm (${algorithm}).`)
  }
  return record
}
