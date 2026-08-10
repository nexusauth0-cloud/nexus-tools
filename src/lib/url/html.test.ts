// @vitest-environment happy-dom
import { describe, expect, it } from "vitest"
import { analyzeHtml, parseHtml } from "./html"

const RICH_HTML = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Page Title Here</title>
  <meta name="description" content="A fine description of the page.">
  <meta name="robots" content="index, follow">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="canonical" href="https://example.com/canonical">
  <link rel="icon" href="/favicon.ico">
  <meta property="og:title" content="OG Title">
  <meta property="og:description" content="OG Description">
  <meta property="og:image" content="https://example.com/og.png">
  <meta property="og:url" content="https://example.com/">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="Example">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="Tweet Title">
  <meta name="twitter:description" content="Tweet desc">
  <meta name="twitter:image" content="https://example.com/tw.png">
  <script type="application/ld+json">{"@context":"https://schema.org","@type":"WebSite"}</script>
</head>
<body>
  <h1>Only H1</h1>
  <h2>Sub A</h2><h2>Sub B</h2>
  <h3>Sub-sub</h3>
</body>
</html>`

describe("analyzeHtml", () => {
  it("extracts the full set of head metadata", () => {
    const analysis = analyzeHtml(RICH_HTML)
    expect(analysis.head.title).toBe("Page Title Here")
    expect(analysis.head.titleLength).toBe(15)
    expect(analysis.head.description).toBe("A fine description of the page.")
    expect(analysis.head.canonical).toBe("https://example.com/canonical")
    expect(analysis.head.robots).toBe("index, follow")
    expect(analysis.head.viewport).toBe("width=device-width, initial-scale=1")
    expect(analysis.head.charset).toBe("utf-8")
    expect(analysis.head.lang).toBe("en")
    expect(analysis.head.favicon).toBe("/favicon.ico")
  })

  it("extracts Open Graph tags by property", () => {
    const analysis = analyzeHtml(RICH_HTML)
    expect(analysis.og).toEqual({
      title: "OG Title",
      description: "OG Description",
      image: "https://example.com/og.png",
      url: "https://example.com/",
      type: "website",
      siteName: "Example",
    })
  })

  it("extracts Twitter card tags by name", () => {
    const analysis = analyzeHtml(RICH_HTML)
    expect(analysis.twitter).toEqual({
      card: "summary_large_image",
      title: "Tweet Title",
      description: "Tweet desc",
      image: "https://example.com/tw.png",
    })
  })

  it("counts headings", () => {
    const analysis = analyzeHtml(RICH_HTML)
    expect(analysis.h1Count).toBe(1)
    expect(analysis.h2Count).toBe(2)
    expect(analysis.h3Count).toBe(1)
  })

  it("detects JSON-LD blocks and schema.org references", () => {
    const analysis = analyzeHtml(RICH_HTML)
    expect(analysis.jsonLdBlockCount).toBe(1)
    expect(analysis.hasSchemaOrg).toBe(true)
  })

  it("reports missing metadata as null (never fabricated)", () => {
    const analysis = analyzeHtml("<html><head><title></title></head><body></body></html>")
    expect(analysis.head.title).toBeNull()
    expect(analysis.head.description).toBeNull()
    expect(analysis.head.canonical).toBeNull()
    expect(analysis.head.viewport).toBeNull()
    expect(analysis.head.lang).toBeNull()
    expect(analysis.head.titleLength).toBe(0)
  })

  it("counts multiple h1 elements", () => {
    const analysis = analyzeHtml("<html><body><h1>A</h1><h1>B</h1></body></html>")
    expect(analysis.h1Count).toBe(2)
  })

  it("tolerates malformed HTML (missing close tags, stray markup)", () => {
    const analysis = analyzeHtml("<html><head><title>Broken <b>bold</title></head><body><h1>x")
    expect(analysis.head.title).toBe("Broken bold")
    expect(analysis.h1Count).toBe(1)
  })

  it("handles uppercase tag names", () => {
    const analysis = analyzeHtml("<HTML><HEAD><TITLE>Upper</TITLE></HEAD><BODY></BODY></HTML>")
    expect(analysis.head.title).toBe("Upper")
  })

  it("counts multiple JSON-LD blocks", () => {
    const html = `<html><head>
      <script type="application/ld+json">{"@context":"https://schema.org"}</script>
      <script type="application/ld+json">{"@type":"Person"}</script>
    </head><body></body></html>`
    const analysis = analyzeHtml(html)
    expect(analysis.jsonLdBlockCount).toBe(2)
    expect(analysis.hasSchemaOrg).toBe(true)
  })
})

describe("parseHtml", () => {
  it("produces an inert document (no scripts executed)", () => {
    const doc = parseHtml(
      "<html><head><script>window.__pwned = true</script></head><body></body></html>"
    )
    expect(doc.querySelector("script")?.textContent).toContain("__pwned")
  })
})
