import { jsonToBase64Url } from "./encoding"

/**
 * JWT signing — Web Crypto HMAC only (HS256 / HS384 / HS512).
 *
 * Signing happens locally in the browser; the secret never leaves the
 * client, is never logged, and is never persisted. No RSA/ECDSA: we
 * implement only algorithms we can do correctly with Web Crypto.
 */

export type JwtAlgorithm = "HS256" | "HS384" | "HS512"

export const JWT_ALGORITHMS: readonly JwtAlgorithm[] = ["HS256", "HS384", "HS512"]

export const JWT_MAX_SECRET_CHARS = 4096
export const JWT_MAX_HEADER_CHARS = 2048
export const JWT_MAX_PAYLOAD_CHARS = 65_536

const HASH_BY_ALGORITHM: Record<JwtAlgorithm, "SHA-256" | "SHA-384" | "SHA-512"> = {
  HS256: "SHA-256",
  HS384: "SHA-384",
  HS512: "SHA-512",
}

export class JwtSigningError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "JwtSigningError"
  }
}

function getSubtle(): SubtleCrypto {
  const subtle =
    typeof crypto !== "undefined"
      ? crypto.subtle
      : (globalThis as { crypto?: Crypto }).crypto?.subtle
  if (!subtle) {
    throw new JwtSigningError("Web Crypto is not available in this browser.")
  }
  return subtle
}

/** Sign a message with HMAC via Web Crypto. */
export async function hmacSign(
  algorithm: JwtAlgorithm,
  secret: string,
  data: string
): Promise<string> {
  const subtle = getSubtle()
  const secretBytes = new TextEncoder().encode(secret)
  const dataBytes = new TextEncoder().encode(data)

  const key = await subtle.importKey(
    "raw",
    secretBytes,
    { name: "HMAC", hash: HASH_BY_ALGORITHM[algorithm] },
    false,
    ["sign"]
  )
  const signature = await subtle.sign("HMAC", key, dataBytes)
  return bytesToBase64UrlHelper(new Uint8Array(signature))
}

/** Produce the full `header.payload.signature` token. */
export async function buildJwt(input: {
  algorithm: JwtAlgorithm
  secret: string
  header: Record<string, unknown>
  payload: Record<string, unknown>
}): Promise<{
  token: string
  headerSection: string
  payloadSection: string
  signatureSection: string
}> {
  if (input.secret.length === 0) {
    throw new JwtSigningError("Enter a signing secret.")
  }
  const headerSection = jsonToBase64Url(input.header)
  const payloadSection = jsonToBase64Url(input.payload)
  const signingInput = `${headerSection}.${payloadSection}`
  const signatureSection = await hmacSign(input.algorithm, input.secret, signingInput)
  return {
    token: `${signingInput}.${signatureSection}`,
    headerSection,
    payloadSection,
    signatureSection,
  }
}

function bytesToBase64UrlHelper(bytes: Uint8Array): string {
  let binary = ""
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i])
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}
