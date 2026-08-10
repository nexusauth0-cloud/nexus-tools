// @vitest-environment happy-dom

import { afterEach, describe, expect, it } from "vitest"
import { setNetworkFetcher, restoreDefaultNetworkFetcher } from "@/lib/url/fetch"
import { metaTagAnalyzerEngine } from "./engine"

const PAGE = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>A Fully Fitted Page</title>
  <meta name="description" content="A meta description of comfortable length for testing.">
  <link rel="canonical" href="https://example.com/canonical">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta property="og:title" content="OG Title">
</head>
<body><h1>One Heading</h1></body>
</html>`

afterEach(() => {
  restoreDefaultNetworkFetcher()
})

function htmlResponse(body: string): Response {
  return new Response(body, {
    status: 200,
    headers: { "content-type": "text/html; charset=utf-8" },
  })
}

describe("metaTagAnalyzerEngine", () => {
  it("analyzes a page and extracts title, description, canonical and headings", async () => {
    setNetworkFetcher(async () => htmlResponse(PAGE))
    const result = await metaTagAnalyzerEngine.run({ url: "https://example.com/" })
    const output = result.output
    expect(output.notAnalyzed).toBe(false)
    expect(output.analysis.head.title).toBe("A Fully Fitted Page")
    expect(output.analysis.head.titleLength).toBe(19)
    expect(output.analysis.head.canonical).toBe("https://example.com/canonical")
    expect(output.analysis.head.lang).toBe("en")
    expect(output.analysis.og.title).toBe("OG Title")
    expect(output.analysis.h1Count).toBe(1)
    expect(output.warnings).toHaveLength(0)
    expect(output.status).toBe(200)
  })

  it("flags missing title and description with guidance", async () => {
    setNetworkFetcher(async () => htmlResponse("<html><body><h1>x</h1></body></html>"))
    const result = await metaTagAnalyzerEngine.run({ url: "https://example.com/empty" })
    const kinds = result.output.flags.map((f) => `${f.kind}:${f.fact}`)
    expect(kinds.some((k) => k.includes("No title element"))).toBe(true)
    expect(kinds.some((k) => k.includes("No meta description"))).toBe(true)
    expect(kinds.some((k) => k.includes('No <link rel="canonical">'))).toBe(true)
    expect(kinds.some((k) => k.includes("No viewport"))).toBe(true)
  })

  it("flags multiple h1 elements", async () => {
    setNetworkFetcher(async () => htmlResponse("<html><body><h1>A</h1><h1>B</h1></body></html>"))
    const result = await metaTagAnalyzerEngine.run({ url: "https://example.com/two-h1" })
    expect(result.output.flags.some((f) => f.fact.includes("2 <h1>"))).toBe(true)
  })

  it("reports binary responses as not analyzed", async () => {
    setNetworkFetcher(
      async () =>
        new Response(new Uint8Array([137, 80, 78, 71]), {
          status: 200,
          headers: { "content-type": "image/png" },
        })
    )
    const result = await metaTagAnalyzerEngine.run({ url: "https://example.com/logo.png" })
    expect(result.output.notAnalyzed).toBe(true)
    expect(result.output.warnings[0]).toContain("image/png")
    expect(result.output.flags).toHaveLength(0)
  })

  it("warns when content type is not HTML but still parses", async () => {
    setNetworkFetcher(
      async () =>
        new Response("<html><head><title>T</title></head><body></body></html>", {
          status: 200,
          headers: { "content-type": "application/json" },
        })
    )
    const result = await metaTagAnalyzerEngine.run({ url: "https://example.com/odd" })
    expect(result.output.notAnalyzed).toBe(false)
    expect(result.output.analysis.head.title).toBe("T")
    expect(result.output.warnings.some((w) => w.includes("application/json"))).toBe(true)
  })

  it("rejects unreachable sites with the CORS-safe message", async () => {
    setNetworkFetcher(async () => {
      throw new TypeError("Failed to fetch")
    })
    await expect(metaTagAnalyzerEngine.run({ url: "https://blocked.example" })).rejects.toThrow(
      /does not allow browser-based cross-origin/
    )
  })
})
