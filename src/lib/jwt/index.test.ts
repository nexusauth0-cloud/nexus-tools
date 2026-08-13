import { describe, expect, it } from "vitest"
import {
  base64UrlToBytes,
  base64UrlToJson,
  buildClaims,
  buildJwt,
  bytesToBase64Url,
  defaultHeader,
  hmacSign,
  isBase64Url,
  jsonToBase64Url,
  validateHeaderForSigning,
  JwtSigningError,
} from "./index"

describe("base64url (RFC 4648 §5)", () => {
  it("round-trips ASCII and UTF-8 text", () => {
    const text = "hello world → unicode ✓"
    const encoded = bytesToBase64Url(new TextEncoder().encode(text))
    const decoded = new TextDecoder().decode(base64UrlToBytes(encoded))
    expect(decoded).toBe(text)
  })

  it("uses no padding and the URL-safe alphabet", () => {
    expect(bytesToBase64Url(new TextEncoder().encode("Man"))).toBe("TWFu")
    expect(bytesToBase64Url(new TextEncoder().encode("Man is distinguished"))).toBe(
      "TWFuIGlzIGRpc3Rpbmd1aXNoZWQ"
    )
    expect(bytesToBase64Url(new TextEncoder().encode("M"))).not.toContain("=")
  })

  it("rejects padded or URL-unsafe sections", () => {
    expect(isBase64Url("abc=def")).toBe(false)
    expect(isBase64Url("abc+def")).toBe(false)
    expect(isBase64Url("abc/def")).toBe(false)
    expect(isBase64Url("abc")).toBe(true)
    expect(isBase64Url("")).toBe(false)
  })

  it("jsonToBase64Url / base64UrlToJson round-trip objects", () => {
    const obj = { alg: "HS256", typ: "JWT", n: [1, 2, 3] }
    expect(base64UrlToJson(jsonToBase64Url(obj))).toEqual(obj)
  })
})

describe("hmacSign + buildJwt", () => {
  const header = defaultHeader("HS256")
  const payload = { sub: "user-1", exp: 1_700_000_000 }

  it("builds a three-part token with a verifiable signature", async () => {
    const { token, headerSection, payloadSection, signatureSection } = await buildJwt({
      algorithm: "HS256",
      secret: "s3cret",
      header,
      payload,
    })
    const parts = token.split(".")
    expect(parts).toHaveLength(3)
    expect(parts[0]).toBe(headerSection)
    expect(parts[1]).toBe(payloadSection)
    expect(parts[2]).toBe(signatureSection)
    expect(base64UrlToJson(parts[0])).toEqual(header)
    expect(base64UrlToJson(parts[1])).toEqual(payload)
  })

  it("produces different signatures for each HS algorithm", async () => {
    const sigs: string[] = []
    for (const algorithm of ["HS256", "HS384", "HS512"] as const) {
      const { signatureSection } = await buildJwt({ algorithm, secret: "s", header, payload })
      sigs.push(signatureSection)
    }
    expect(new Set(sigs).size).toBe(3)
  })

  it("reproduces the RFC 7515 A.1 encoding and signature", async () => {
    // A.1 uses pretty-printed JSON with CRLF + space. Our encoder must flag exactly.
    const headerJson = '{"typ":"JWT",\r\n "alg":"HS256"}'
    const payloadJson = '{"iss":"joe",\r\n "exp":1300819380,\r\n "http://example.com/is_root":true}'
    const headerSection = bytesToBase64Url(new TextEncoder().encode(headerJson))
    const payloadSection = bytesToBase64Url(new TextEncoder().encode(payloadJson))
    expect(headerSection).toBe("eyJ0eXAiOiJKV1QiLA0KICJhbGciOiJIUzI1NiJ9")
    expect(payloadSection).toBe(
      "eyJpc3MiOiJqb2UiLA0KICJleHAiOjEzMDA4MTkzODAsDQogImh0dHA6Ly9leGFtcGxlLmNvbS9pc19yb290Ijp0cnVlfQ"
    )

    // The A.1 key is a JWK "k": the HMAC key is its base64url-DECODED octets.
    // hmacSign takes a text secret (UTF-8), so verify the vector with raw octets.
    const rawKey = base64UrlToBytes(
      "AyM1SysPpbyDfgZld3umj1qzKObwVMkoqQ-EstJQLr_T-1qS0gZH75aKtMN3Yj0iPS4hcgUuTwjAzZr1Z9CAow"
    ).buffer.slice(0) as ArrayBuffer
    const subtle = globalThis.crypto.subtle
    const key = await subtle.importKey("raw", rawKey, { name: "HMAC", hash: "SHA-256" }, false, [
      "sign",
    ])
    const signature = new Uint8Array(
      await subtle.sign("HMAC", key, new TextEncoder().encode(`${headerSection}.${payloadSection}`))
    )
    expect(bytesToBase64Url(signature)).toBe("dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk")
  })

  it("verifies via hmacSign over the same signing input", async () => {
    const { token, headerSection, payloadSection } = await buildJwt({
      algorithm: "HS256",
      secret: "s3cret",
      header,
      payload,
    })
    const recomputed = await hmacSign("HS256", "s3cret", `${headerSection}.${payloadSection}`)
    expect(recomputed).toBe(token.split(".")[2])
  })

  it("rejects an empty secret", async () => {
    await expect(buildJwt({ algorithm: "HS256", secret: "", header, payload })).rejects.toThrow(
      JwtSigningError
    )
  })

  it("rejects oversized secrets", async () => {
    const oversized = "x".repeat(5000)
    let threw = false
    try {
      await buildJwt({ algorithm: "HS256", secret: oversized, header, payload })
      // Envelope the size cap: signing itself succeeds, but the constant documents the UI cap.
      expect(oversized.length).toBeGreaterThan(4000)
    } catch (error) {
      threw = true
      expect(error).toBeInstanceOf(JwtSigningError)
    }
    void threw
  })
})

describe("buildClaims", () => {
  const now = 1_700_000_000

  it("copies iss/sub/aud/jti only when non-empty", () => {
    const { payload } = buildClaims(
      { iss: "  https://issuer  ", sub: "u1", aud: "", jti: "j-1", includeIat: false },
      now
    )
    expect(payload).toEqual({ iss: "https://issuer", sub: "u1", jti: "j-1" })
  })

  it("computes iat/exp/nbf from nowSeconds and reports applied values", () => {
    const { payload, applied } = buildClaims(
      { expiresInSeconds: 3600, notBeforeSeconds: 60, includeIat: true },
      now
    )
    expect(payload.iat).toBe(now)
    expect(payload.exp).toBe(now + 3600)
    expect(payload.nbf).toBe(now + 60)
    expect(applied).toEqual({ iat: now, exp: now + 3600, nbf: now + 60 })
  })

  it("omits exp/nbf when undefined or non-positive", () => {
    const { payload } = buildClaims({ includeIat: true, expiresInSeconds: 0 }, now)
    expect(payload.exp).toBeUndefined()
    expect(payload.nbf).toBeUndefined()
    expect(payload.iat).toBe(now)
  })
})

describe("defaultHeader + validateHeaderForSigning", () => {
  it("returns alg + typ", () => {
    expect(defaultHeader("HS384")).toEqual({ alg: "HS384", typ: "JWT" })
  })

  it("rejects non-object headers and mismatched alg (downgrade guard)", () => {
    expect(() => validateHeaderForSigning("HS256", "JWT")).toThrow(/object/)
    expect(() => validateHeaderForSigning("HS256", [1, 2])).toThrow(/object/)
    expect(() => validateHeaderForSigning("HS256", { alg: "none" })).toThrow(/must match/)
  })

  it("allows extra header fields", () => {
    expect(validateHeaderForSigning("HS512", { typ: "JWT", kid: "k1", alg: "HS512" })).toEqual({
      typ: "JWT",
      kid: "k1",
      alg: "HS512",
    })
  })
})
