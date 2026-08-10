import { afterEach, describe, expect, it } from "vitest"
import { setNetworkFetcher, restoreDefaultNetworkFetcher } from "@/lib/url/fetch"
import { httpHeadersEngine } from "./engine"

function responseFrom(init: {
  status?: number
  headers?: Record<string, string>
  body?: string
  url?: string
}): Response {
  const response = new Response(init.body ?? "", {
    status: init.status ?? 200,
    headers: init.headers,
  })
  if (init.url) Object.defineProperty(response, "url", { value: init.url })
  return response
}

afterEach(() => {
  restoreDefaultNetworkFetcher()
})

describe("httpHeadersEngine", () => {
  it("reports exposed headers with their values and missing ones honestly", async () => {
    setNetworkFetcher(async () =>
      responseFrom({
        headers: {
          "content-type": "text/html; charset=utf-8",
          "cache-control": "public, max-age=3600",
          "content-security-policy": "default-src 'self'",
        },
      })
    )
    const result = await httpHeadersEngine.run({ url: "https://example.com/" })
    const output = result.output
    expect(output.status).toBe(200)
    expect(output.finalUrl).toBe("https://example.com/")

    const byName = new Map(output.findings.map((f) => [f.name, f]))
    expect(byName.get("Content-Type")).toMatchObject({
      state: "exposed",
      value: "text/html; charset=utf-8",
    })
    expect(byName.get("Cache-Control")).toMatchObject({ state: "exposed" })
    expect(byName.get("Content-Security-Policy")).toMatchObject({ state: "exposed" })
    expect(byName.get("Strict-Transport-Security")).toMatchObject({ state: "missing" })
    expect(byName.get("Permissions-Policy")).toMatchObject({ state: "missing" })
  })

  it("recommends guidance only for missing security headers", async () => {
    setNetworkFetcher(async () => responseFrom({ headers: { "content-type": "text/plain" } }))
    const result = await httpHeadersEngine.run({ url: "https://example.com/" })
    const recommendations = result.output.recommendations
    expect(recommendations.some((r) => r.includes("Content-Security-Policy"))).toBe(true)
    expect(recommendations.some((r) => r.includes("Strict-Transport-Security"))).toBe(true)
    expect(recommendations.every((r) => !r.includes("Cache-Control"))).toBe(true)
  })

  it("surfaces HTTP error statuses without failing (caller decides)", async () => {
    setNetworkFetcher(async () =>
      responseFrom({ status: 404, headers: { "content-type": "text/plain" } })
    )
    const result = await httpHeadersEngine.run({ url: "https://example.com/missing" })
    expect(result.output.status).toBe(404)
  })

  it("rejects when the site is unreachable with the CORS-safe message", async () => {
    setNetworkFetcher(async () => {
      throw new TypeError("Failed to fetch")
    })
    await expect(httpHeadersEngine.run({ url: "https://blocked.example" })).rejects.toThrow(
      /does not allow browser-based cross-origin/
    )
  })

  it("rejects invalid URLs as validation failures", async () => {
    await expect(httpHeadersEngine.run({ url: "file:///etc/passwd" })).rejects.toThrow(
      /Protocol "file:" is not supported/
    )
  })

  it("never fetches for empty input", async () => {
    await expect(httpHeadersEngine.run({ url: "" })).rejects.toThrow(/fix your input/)
  })
})
