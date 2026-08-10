// @vitest-environment happy-dom

import { afterEach, describe, expect, it } from "vitest"
import { setNetworkFetcher, restoreDefaultNetworkFetcher } from "@/lib/url/fetch"
import { sitemapCheckerEngine } from "./engine"

const URLSET = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://example.com/</loc><lastmod>2026-08-01</lastmod></url>
  <url><loc>https://example.com/about</loc></url>
  <url><loc>https://example.com/dup</loc></url>
  <url><loc>https://example.com/dup</loc></url>
  <url><loc>not a url</loc><priority>7</priority></url>
  <url><changefreq>daily</changefreq></url>
</urlset>`

afterEach(() => {
  restoreDefaultNetworkFetcher()
})

function xmlResponse(body: string): Response {
  return new Response(body, {
    status: 200,
    headers: { "content-type": "application/xml" },
  })
}

describe("sitemapCheckerEngine", () => {
  it("parses a urlset and summarizes entries plus violations", async () => {
    setNetworkFetcher(async () => xmlResponse(URLSET))
    const result = await sitemapCheckerEngine.run({ url: "https://example.com/sitemap.xml" })
    const output = result.output
    expect(output.parsed.ok).toBe(true)
    expect(output.parsed.root).toBe("urlset")
    expect(output.parsed.entries).toHaveLength(5)
    expect(output.sampleUrls[0]).toBe("https://example.com/")
    expect(output.parsed.duplicateCount).toBe(1)
    expect(output.parsed.missingLocCount).toBe(1)
    expect(output.parsed.invalidLocCount).toBe(1)
    expect(output.parsed.invalidPriorityCount).toBe(1)
    expect(output.warnings).toHaveLength(0)
  })

  it("recognizes a sitemapindex", async () => {
    setNetworkFetcher(async () =>
      xmlResponse(
        `<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
          <sitemap><loc>https://example.com/sitemap-1.xml</loc></sitemap>
          <sitemap><loc>https://example.com/sitemap-2.xml</loc></sitemap>
        </sitemapindex>`
      )
    )
    const result = await sitemapCheckerEngine.run({ url: "https://example.com/sitemap-index.xml" })
    expect(result.output.parsed.root).toBe("sitemapindex")
    expect(result.output.parsed.sitemapCount).toBe(2)
    expect(result.output.sampleUrls).toEqual([
      "https://example.com/sitemap-1.xml",
      "https://example.com/sitemap-2.xml",
    ])
  })

  it("surfaces unparsable XML as a warning without failing", async () => {
    setNetworkFetcher(async () => xmlResponse("<urlset><url><loc>broken"))
    const result = await sitemapCheckerEngine.run({ url: "https://example.com/broken.xml" })
    expect(result.output.parsed.ok).toBe(false)
    expect(result.output.warnings.some((w) => w.includes("could not be parsed"))).toBe(true)
    expect(result.output.sampleUrls).toHaveLength(0)
  })

  it("warns when content type is not XML but parses anyway", async () => {
    setNetworkFetcher(
      async () => new Response(URLSET, { status: 200, headers: { "content-type": "text/plain" } })
    )
    const result = await sitemapCheckerEngine.run({ url: "https://example.com/plain.txt" })
    expect(result.output.parsed.ok).toBe(true)
    expect(result.output.warnings.some((w) => w.includes("text/plain"))).toBe(true)
  })

  it("rejects unreachable sites with the CORS-safe message", async () => {
    setNetworkFetcher(async () => {
      throw new TypeError("Failed to fetch")
    })
    await expect(
      sitemapCheckerEngine.run({ url: "https://blocked.example/sitemap.xml" })
    ).rejects.toThrow(/does not allow browser-based cross-origin/)
  })
})
