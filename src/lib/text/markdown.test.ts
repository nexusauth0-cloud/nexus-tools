import { describe, expect, it } from "vitest"
import { markdownToHtml, safeUrl } from "./markdown"

describe("markdownToHtml — blocks", () => {
  it("renders headings", () => {
    expect(markdownToHtml("# One")).toBe("<h1>One</h1>")
    expect(markdownToHtml("###### Six")).toBe("<h6>Six</h6>")
    expect(markdownToHtml("##Not a heading without space")).toBe(
      "<p>##Not a heading without space</p>"
    )
  })

  it("renders paragraphs joined from consecutive lines", () => {
    expect(markdownToHtml("first line\nsecond line")).toBe("<p>first line second line</p>")
  })

  it("renders horizontal rules", () => {
    expect(markdownToHtml("a\n\n---\n\nb")).toBe("<p>a</p>\n<hr />\n<p>b</p>")
  })

  it("renders blockquotes", () => {
    expect(markdownToHtml("> quoted text")).toBe("<blockquote>quoted text</blockquote>")
  })

  it("renders ordered and unordered lists", () => {
    expect(markdownToHtml("- one\n- two")).toBe("<ul><li>one</li><li>two</li></ul>")
    expect(markdownToHtml("1. one\n2. two")).toBe("<ol><li>one</li><li>two</li></ol>")
  })

  it("renders nested lists with two-space indent", () => {
    const html = markdownToHtml("- top\n  - nested\n- next")
    expect(html).toBe("<ul><li>top<ul><li>nested</li></ul></li><li>next</li></ul>")
  })

  it("renders fenced code blocks verbatim", () => {
    const html = markdownToHtml("```js\nconst x = < 5;\n```")
    expect(html).toContain('<pre><code class="language-js">const x = &lt; 5;</code></pre>')
  })

  it("renders pipe tables with alignment", () => {
    const html = markdownToHtml("| a | b |\n| :-: | -: |\n| 1 | 2 |")
    expect(html).toBe(
      '<table><thead><tr><th align="center">a</th><th align="right">b</th></tr></thead><tbody><tr><td align="center">1</td><td align="right">2</td></tr></tbody></table>'
    )
  })
})

describe("markdownToHtml — inline", () => {
  it("renders emphasis, strong, and strikethrough", () => {
    expect(markdownToHtml("*em*")).toBe("<p><em>em</em></p>")
    expect(markdownToHtml("**strong**")).toBe("<p><strong>strong</strong></p>")
    expect(markdownToHtml("~~gone~~")).toBe("<p><del>gone</del></p>")
  })

  it("renders inline code", () => {
    expect(markdownToHtml("use `npm i` here")).toBe("<p>use <code>npm i</code> here</p>")
  })

  it("renders links with safe attributes", () => {
    const html = markdownToHtml("[site](https://example.com)")
    expect(html).toBe(
      '<p><a href="https://example.com" target="_blank" rel="noopener noreferrer nofollow">site</a></p>'
    )
  })

  it("renders mailto links", () => {
    const html = markdownToHtml("[mail](mailto:hi@example.com)")
    expect(html).toContain('href="mailto:hi@example.com"')
  })

  it("renders images lazily with escaped alt", () => {
    const html = markdownToHtml('![alt "text"](https://example.com/i.png)')
    expect(html).toContain(
      '<img src="https://example.com/i.png" alt="alt &quot;text&quot;" loading="lazy" />'
    )
  })
})

describe("markdownToHtml — security", () => {
  it("never emits raw <script> content", () => {
    const html = markdownToHtml("<script>alert(1)</script>")
    expect(html).not.toContain("<script>")
    expect(html).toContain("&lt;script&gt;")
  })

  it("escapes event-handler attributes", () => {
    const html = markdownToHtml('<img src="x" onerror="alert(1)">')
    expect(html).toBe("<p>&lt;img src=&quot;x&quot; onerror=&quot;alert(1)&quot;&gt;</p>")
    expect(html).not.toContain("<img")
    expect(html).not.toContain('<img src="x"')
  })

  it("strips javascript: URLs from links", () => {
    const html = markdownToHtml("[click](javascript:alert(1))")
    expect(html).not.toContain("href=")
    expect(html).toContain("click")
  })

  it("strips javascript: URLs from images", () => {
    const html = markdownToHtml("![x](javascript:alert(1))")
    expect(html).not.toContain("<img")
  })

  it("rejects data:, vbscript:, and file: schemes", () => {
    expect(markdownToHtml("[x](data:text/html,<b>hi</b>)")).not.toContain("href=")
    expect(markdownToHtml("[x](vbscript:msgbox(1))")).not.toContain("href=")
    expect(markdownToHtml("[x](file:///etc/passwd)")).not.toContain("href=")
  })

  it("allows scheme-less relative URLs", () => {
    const html = markdownToHtml("[x](/about)")
    expect(html).toContain('href="/about"')
  })

  it("neutralizes mixed-case javascript and encoded attempts", () => {
    expect(markdownToHtml("[x](JaVaScRiPt:alert(1))")).not.toContain("href=")
    expect(markdownToHtml("[x](javascript&colon;alert(1))")).not.toContain("javascript&colon")
  })

  it("treats HTML in code blocks as plain escaped text", () => {
    const html = markdownToHtml("```\n<script>alert(1)</script>\n```")
    expect(html).toContain("&lt;script&gt;")
    expect(html).not.toContain("<script>")
  })

  it("does not execute anything on malformed input", () => {
    const html = markdownToHtml("[unclosed\n**bold** never closed\n![x](broken")
    expect(typeof html).toBe("string")
    expect(html.length).toBeGreaterThan(0)
  })

  it("handles empty markdown", () => {
    expect(markdownToHtml("")).toBe("")
    expect(markdownToHtml("   \n\n  ")).toBe("")
  })

  it("handles extremely long single-line input without runaway parsing", () => {
    const long = "a".repeat(100_000)
    const html = markdownToHtml(long)
    expect(html).toContain("a")
    expect(html.length).toBeGreaterThan(long.length)
  })
})

describe("safeUrl", () => {
  it("allows https, http, mailto, and relative URLs", () => {
    expect(safeUrl("https://x.com")).toBe("https://x.com")
    expect(safeUrl("HTTP://x.com")).toBe("HTTP://x.com")
    expect(safeUrl("mailto:a@b.c")).toBe("mailto:a@b.c")
    expect(safeUrl("/relative")).toBe("/relative")
    expect(safeUrl("page.html")).toBe("page.html")
  })

  it("rejects dangerous schemes", () => {
    expect(safeUrl("javascript:alert(1)")).toBe("")
    expect(safeUrl("JaVaScRiPt:alert(1)")).toBe("")
    expect(safeUrl("data:text/html,<b>hi</b>")).toBe("")
    expect(safeUrl("vbscript:x")).toBe("")
    expect(safeUrl("file:///etc")).toBe("")
  })
})
