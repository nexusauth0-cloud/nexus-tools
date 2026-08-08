import { describe, expect, it } from "vitest"
import { jwtDecoderEngine } from "./engine"

/** Encode a JSON object as a base64url JWT section (test-only helper). */
function b64url(input: string): string {
  return btoa(input).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}

function makeToken(header: unknown, payload: unknown, signature = "signature"): string {
  return `${b64url(JSON.stringify(header))}.${b64url(JSON.stringify(payload))}.${b64url(signature)}`
}

describe("jwtDecoderEngine — structure", () => {
  it("decodes a valid token header and payload", async () => {
    const result = await jwtDecoderEngine.run({
      token: makeToken({ alg: "HS256", typ: "JWT" }, { name: "Alice", role: "admin" }),
    })
    expect(result.output.header).toEqual({ alg: "HS256", typ: "JWT" })
    expect(result.output.payload).toEqual({ name: "Alice", role: "admin" })
    expect(result.output.signaturePresent).toBe(true)
  })

  it("rejects tokens that do not have exactly three parts", async () => {
    const error = await jwtDecoderEngine.run({ token: "a.b" }).catch((e: unknown) => e)
    expect(error).toBeDefined()
    const error2 = await jwtDecoderEngine.run({ token: "a.b.c.d" }).catch((e: unknown) => e)
    expect(error2).toBeDefined()
  })

  it("rejects malformed base64url", async () => {
    const error = await jwtDecoderEngine.run({ token: "!!!.e30=.e30=" }).catch((e: unknown) => e)
    expect(error).toBeDefined()
    if (error instanceof Error) expect(error.message).not.toMatch(/stack|at \//i)
  })

  it("rejects malformed JSON inside a section", async () => {
    const token = `${b64url("{not json")}.${b64url("{}")}.x`
    const error = await jwtDecoderEngine.run({ token }).catch((e: unknown) => e)
    expect(error).toBeDefined()
    if (error instanceof Error) expect(error.message).toContain("JSON")
  })

  it("rejects empty token", async () => {
    const error = await jwtDecoderEngine.run({ token: "   " }).catch((e: unknown) => e)
    expect(error).toBeDefined()
  })

  it("treats a missing signature as informational, not an error", async () => {
    const result = await jwtDecoderEngine.run({
      token: `${b64url(JSON.stringify({ alg: "none" }))}.${b64url(JSON.stringify({}))}.`,
    })
    expect(result.output.signaturePresent).toBe(false)
  })
})

describe("jwtDecoderEngine — registered claims", () => {
  const nowSeconds = Math.floor(Date.now() / 1000)

  it("extracts iss, sub, aud, jti and their values", async () => {
    const result = await jwtDecoderEngine.run({
      token: makeToken(
        { alg: "RS256" },
        { iss: "auth.example.com", sub: "user-123", aud: "api", jti: "abc", custom: 1 }
      ),
    })
    expect(result.output.claims).toEqual({
      iss: "auth.example.com",
      sub: "user-123",
      aud: "api",
      jti: "abc",
    })
  })

  it("reports an expired token", async () => {
    const result = await jwtDecoderEngine.run({
      token: makeToken({ alg: "HS256" }, { exp: nowSeconds - 3600 }),
    })
    expect(result.output.dates.exp?.expired).toBe(true)
    expect(result.output.dates.exp?.epochSeconds).toBe(nowSeconds - 3600)
  })

  it("reports a future token as not expired with remaining time", async () => {
    const result = await jwtDecoderEngine.run({
      token: makeToken({ alg: "HS256" }, { exp: nowSeconds + 7200 }),
    })
    expect(result.output.dates.exp?.expired).toBe(false)
    expect(result.output.dates.exp?.relativeSeconds).toBeGreaterThan(7100)
  })

  it("renders dates as human-readable RFC 2822 UTC strings", async () => {
    const result = await jwtDecoderEngine.run({
      token: makeToken({ alg: "HS256" }, { iat: 1783590000, nbf: 1783590600, exp: 1783594200 }),
    })
    expect(result.output.dates.iat?.utc).toMatch(/GMT$/)
    expect(result.output.dates.nbf?.utc).toMatch(/GMT$/)
    expect(result.output.dates.exp?.utc).toMatch(/GMT$/)
  })

  it("omits claims that are missing", async () => {
    const result = await jwtDecoderEngine.run({ token: makeToken({ alg: "HS256" }, {}) })
    expect(result.output.claims).toEqual({})
    expect(result.output.dates.exp).toBeUndefined()
  })

  it("ignores non-numeric date claims", async () => {
    const result = await jwtDecoderEngine.run({
      token: makeToken({ alg: "HS256" }, { exp: "not-a-date" }),
    })
    expect(result.output.dates.exp).toBeUndefined()
    expect(result.output.claims.exp).toBe("not-a-date")
  })

  it("warns that decoding is not verification", async () => {
    const result = await jwtDecoderEngine.run({
      token: makeToken({ alg: "HS256" }, { iss: "x" }),
    })
    expect(result.output.notice).toContain("does not verify")
  })
})
