// @vitest-environment happy-dom
import { describe, expect, it } from "vitest"
import { parseSitemapXml } from "./sitemap"

const URLSET = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://example.com/</loc>
    <lastmod>2026-08-01</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://example.com/about</loc>
  </url>
  <url>
    <loc>https://example.com/dup</loc>
  </url>
  <url>
    <loc>https://example.com/dup</loc>
  </url>
  <url>
    <loc>not a url</loc>
    <priority>9.5</priority>
    <changefreq>sometimes</changefreq>
  </url>
  <url>
    <changefreq>daily</changefreq>
  </url>
</urlset>`

const SITEMAPINDEX = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>https://example.com/sitemap-1.xml</loc>
    <lastmod>2026-08-01</lastmod>
  </sitemap>
  <sitemap>
    <loc>https://example.com/sitemap-2.xml</loc>
  </sitemap>
</sitemapindex>`

describe("parseSitemapXml", () => {
  it("parses a urlset with loc, lastmod, changefreq and priority", () => {
    const result = parseSitemapXml(URLSET)
    expect(result.ok).toBe(true)
    expect(result.root).toBe("urlset")
    expect(result.entries).toHaveLength(5)
    expect(result.entries[0].loc).toBe("https://example.com/")
    expect(result.entries[0].lastmod).toBe("2026-08-01")
    expect(result.entries[0].changefreq).toBe("weekly")
    expect(result.entries[0].priority).toBe("1.0")
    expect(result.lastmodCount).toBe(1)
    expect(result.changefreqCount).toBe(3)
    expect(result.priorityCount).toBe(2)
  })

  it("detects duplicate URLs", () => {
    const result = parseSitemapXml(URLSET)
    expect(result.duplicateCount).toBe(1)
    expect(result.violations.some((v) => v.kind === "duplicate-loc")).toBe(true)
  })

  it("flags missing loc elements", () => {
    const result = parseSitemapXml(URLSET)
    expect(result.missingLocCount).toBe(1)
    expect(result.violations.some((v) => v.kind === "missing-loc")).toBe(true)
  })

  it("flags invalid (relative/non-http) URLs", () => {
    const result = parseSitemapXml(URLSET)
    expect(result.invalidLocCount).toBe(1)
    expect(result.violations.some((v) => v.kind === "invalid-loc")).toBe(true)
  })

  it("flags out-of-range priority values", () => {
    const result = parseSitemapXml(URLSET)
    expect(result.invalidPriorityCount).toBe(1)
    expect(result.violations.some((v) => v.kind === "invalid-priority")).toBe(true)
  })

  it("flags invalid changefreq values", () => {
    const result = parseSitemapXml(URLSET)
    expect(result.invalidChangefreqCount).toBe(1)
    expect(result.violations.some((v) => v.kind === "invalid-changefreq")).toBe(true)
  })

  it("parses a sitemapindex", () => {
    const result = parseSitemapXml(SITEMAPINDEX)
    expect(result.ok).toBe(true)
    expect(result.root).toBe("sitemapindex")
    expect(result.entries).toHaveLength(2)
    expect(result.sitemapCount).toBe(2)
    expect(result.lastmodCount).toBe(1)
  })

  it("reports malformed XML with a clear error", () => {
    const result = parseSitemapXml("<urlset><url><loc>broken")
    expect(result.ok).toBe(false)
    expect(result.error).toContain("could not be parsed")
  })

  it("handles a fully empty document", () => {
    const result = parseSitemapXml("")
    expect(result.ok).toBe(false)
  })

  it("treats unclosed-element garbage as unparsable", () => {
    const result = parseSitemapXml("not xml at all <<<")
    expect(result.ok).toBe(false)
  })

  it("copes with namespaced prefixes", () => {
    const xml = `<?xml version="1.0"?>
    <sm:urlset xmlns:sm="http://www.sitemaps.org/schemas/sitemap/0.9">
      <sm:url><sm:loc>https://example.com/prefixed</sm:loc></sm:url>
    </sm:urlset>`
    const result = parseSitemapXml(xml)
    expect(result.ok).toBe(true)
    expect(result.root).toBe("urlset")
    expect(result.entries[0].loc).toBe("https://example.com/prefixed")
  })

  it("bounded violations output", () => {
    const items = Array.from(
      { length: 100 },
      (_, i) => `<url><loc>https://example.com/${i}</loc><priority>7</priority></url>`
    ).join("")
    expect(
      parseSitemapXml(`<urlset>${items}</urlset>`, { maxViolations: 10 }).violations.length
    ).toBe(10)
  })
})
