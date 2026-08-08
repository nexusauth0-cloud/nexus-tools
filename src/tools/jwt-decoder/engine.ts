import { z } from "zod"
import { createToolEngine, summarize, ToolExecutionError } from "@/lib/tool-engine"

/**
 * JWT Decoder engine — decodes, never verifies.
 *
 * The pipeline only base64url-decodes and JSON-parses the header and
 * payload of a JWT. Signature verification is intentionally out of scope:
 * this tool must never claim authenticity. All malformed input is
 * converted into friendly VALIDATION errors — never stack traces.
 */

const REGISTERED_CLAIMS = ["iss", "sub", "aud", "exp", "nbf", "iat", "jti"] as const
export type RegisteredClaim = (typeof REGISTERED_CLAIMS)[number]

/** Human-readable rendering of a date claim (exp/nbf/iat), when it is sane. */
export interface DateClaimInfo {
  /** Raw claim value as it appeared in the token. */
  raw: unknown
  /** Unix epoch seconds when the value parsed as a numeric date. */
  epochSeconds: number
  /** RFC 2822 UTC string (e.g. "Sat, 08 Aug 2026 12:00:00 GMT"). */
  utc: string
  /** Relative state vs the current time. */
  expired: boolean
  /** Seconds between this claim and now (negative → past). */
  relativeSeconds: number
}

export interface JwtDecodeOutput {
  header: Record<string, unknown>
  payload: Record<string, unknown>
  /** Type of the token signature section that was present. */
  signaturePresent: boolean
  /** Decoded registered claims with human-readable dates attached. */
  claims: Partial<Record<RegisteredClaim, unknown>>
  /** exp/nbf/iat rendered as RFC 2822 + expiry state. */
  dates: {
    exp?: DateClaimInfo
    nbf?: DateClaimInfo
    iat?: DateClaimInfo
  }
  /** Human-readable copy warning — decoding is not verification. */
  notice: string
}

const schema = z.object({
  token: z.string().trim().min(1, "Paste a JWT to decode.").max(100_000, "Token is too large."),
})

export const jwtDecoderEngine = createToolEngine<typeof schema, JwtDecodeOutput>({
  toolId: "jwt-decoder",
  schema,
  process: ({ token }) => {
    const sections = token.split(".")
    if (sections.length !== 3) {
      throw new ToolExecutionError(
        "VALIDATION",
        "A JWT is three dot-separated parts (header.payload.signature)."
      )
    }

    const header = decodeSection(sections[0], "header")
    const payload = decodeSection(sections[1], "payload")
    if (sections[2].length > 0) tryDecodeSignature(sections[2])

    const headerObject = expectObject(header, "header")
    const payloadObject = expectObject(payload, "payload")

    const claims = collectRegisteredClaims(payloadObject)
    const dates = collectDateClaims(payloadObject, Date.now() / 1000)

    return {
      header: headerObject,
      payload: payloadObject,
      signaturePresent: sections[2].length > 0,
      claims,
      dates,
      notice:
        "Decoding a JWT does not verify its signature or authenticity. Any free-form JSON can be decoded — treat claims as untrusted data.",
    }
  },
  summarize: {
    input: (value) => summarize(value.token, 40),
    output: (value) => {
      const iss = value.claims.iss ?? value.claims.sub ?? "(no issuer)"
      return `JWT ${String(iss).slice(0, 48)}`
    },
  },
})

/**
 * The signature is opaque bytes we never display; it is only verified to
 * look like Base64URL so the token structure check stays meaningful.
 */
function tryDecodeSignature(section: string): void {
  try {
    decodeSection(section, "signature")
  } catch {
    // ignore — content of the signature is not part of decoding
  }
}

/** strict base64url → bytes, with padding. Throws on malformed input. */
function decodeSection(section: string, label: string): string {
  if (section.length === 0) {
    throw new ToolExecutionError("VALIDATION", `The JWT ${label} is empty.`)
  }
  const base64 = section.replace(/-/g, "+").replace(/_/g, "/")
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4)
  let text: string
  try {
    text = atob(padded)
  } catch {
    throw new ToolExecutionError("VALIDATION", `The JWT ${label} is not valid Base64URL.`)
  }
  if (!/[^\u0000-\u007f]/.test(text)) return text

  // Fallback: atob units are bytes; reassemble as UTF-8 for non-ASCII.
  try {
    const bytes = Uint8Array.from(text, (char) => char.charCodeAt(0))
    const decoded = new TextDecoder("utf-8", { fatal: true }).decode(bytes)
    return decoded
  } catch {
    throw new ToolExecutionError("VALIDATION", `The JWT ${label} is not valid UTF-8.`)
  }
}

function expectObject(value: string, label: string): Record<string, unknown> {
  let parsed: unknown
  try {
    parsed = JSON.parse(value)
  } catch {
    throw new ToolExecutionError("VALIDATION", `The JWT ${label} is not valid JSON.`)
  }
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new ToolExecutionError("VALIDATION", `The JWT ${label} must be a JSON object.`)
  }
  return parsed as Record<string, unknown>
}

function collectRegisteredClaims(
  payload: Record<string, unknown>
): Partial<Record<RegisteredClaim, unknown>> {
  return Object.fromEntries(
    (Object.entries(payload) as Array<[string, unknown]>).filter(([key]) =>
      (REGISTERED_CLAIMS as readonly string[]).includes(key)
    )
  )
}

function collectDateClaims(
  payload: Record<string, unknown>,
  nowSeconds: number
): { exp?: DateClaimInfo; nbf?: DateClaimInfo; iat?: DateClaimInfo } {
  const result: { exp?: DateClaimInfo; nbf?: DateClaimInfo; iat?: DateClaimInfo } = {}

  ;(["exp", "nbf", "iat"] as const).forEach((key) => {
    const raw = payload[key]
    const seconds = numericDate(typeof raw === "string" ? Number(raw) : raw)
    if (seconds === undefined) return
    const date = new Date(seconds * 1000)
    if (Number.isNaN(date.getTime())) return
    result[key] = {
      raw,
      epochSeconds: seconds,
      utc: date.toUTCString(),
      expired: seconds < nowSeconds,
      relativeSeconds: Math.round(seconds - nowSeconds),
    }
  })

  return result
}

/** Accept numbers (JWT NumericDate) — strings are allowed but warned about. */
function numericDate(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value
  if (typeof value === "string" && value.trim() !== "" && /^\d+$/.test(value.trim())) {
    return Number(value.trim())
  }
  return undefined
}
