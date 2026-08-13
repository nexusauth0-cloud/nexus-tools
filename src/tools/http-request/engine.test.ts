import { describe, expect, it } from "vitest"
import { httpRequestEngine } from "./engine"

/**
 * Validation-path tests only — no network is ever touched here. The
 * engine's fetch only runs after all inputs pass validation, so these
 * cases exercise the malformed-URL / header / body / timeout guards.
 */
function completeInput(overrides: Record<string, unknown> = {}) {
  return {
    method: "GET",
    url: "https://example.com/v1/items",
    headers: [],
    bodyKind: "none",
    body: "",
    timeoutMs: 30_000,
    signal: new AbortController().signal,
    ...overrides,
  }
}

async function expectValidationError(input: Record<string, unknown>) {
  const caught = await httpRequestEngine.run(completeInput(input)).catch((error: unknown) => error)
  expect(caught).toMatchObject({ code: "VALIDATION" })
  return caught as { message?: string }
}

describe("httpRequestEngine validation", () => {
  it("rejects an empty URL", async () => {
    await expectValidationError({ url: "" })
  })

  it("distinguishes a malformed URL from a valid one", async () => {
    await expectValidationError({ url: "not a url" })

    // Valid input must pass validation and reach fetch: use a local
    // unroutable port so the request fails fast at the network layer
    // (never touching an external host).
    const caught = await httpRequestEngine
      .run(completeInput({ url: "http://127.0.0.1:1/unreachable" }))
      .catch((error: unknown) => error)
    expect(caught).toMatchObject({ code: "PROCESSING" })
  })

  it("rejects dangerous protocols before any fetch", async () => {
    const caught = await expectValidationError({ url: "javascript:alert(1)" })
    expect(String(caught.message)).toMatch(/not supported/i)
  })

  it("rejects header line breaks", async () => {
    await expectValidationError({
      headers: [{ name: "X-Test", value: "bad\ninjection" }],
    })
  })

  it("rejects invalid JSON bodies", async () => {
    await expectValidationError({ method: "POST", bodyKind: "json", body: "{nope" })
  })

  it("rejects out-of-range timeouts", async () => {
    await expectValidationError({ timeoutMs: 100 })
    await expectValidationError({ timeoutMs: 2_000_000 })
  })
})
