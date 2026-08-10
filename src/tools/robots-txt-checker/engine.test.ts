// @vitest-environment happy-dom

import { afterEach, describe, expect, it } from "vitest"
import { setNetworkFetcher, restoreDefaultNetworkFetcher } from "@/lib/url/fetch"
import { robotsTxtCheckerEngine } from "./engine"

const ROBOTS = `# Example robots.txt
User-agent: *
Allow: /public/
Disallow: /private/
Crawl-delay: 5

User-agent: Googlebot
Disallow: /admin

Sitemap: https://example.com/sitemap.xml
`

afterEach(() => {
  restoreDefaultNetworkFetcher()
})

function robotsResponse(body: string, extra?: Record<string, string>): Response {
  return new Response(body, {
    status: 200,
    headers: { "content-type": "text/plain; charset=utf-8", ...extra },
  })
}

describe("robotsTxtCheckerEngine", () => {
  it("always requests the origin root robots.txt and parses groups", async () => {
    let requested: string | null = null
    setNetworkFetcher(async (input) => {
      requested = String(input)
      return robotsResponse(ROBOTS)
    })
    const result = await robotsTxtCheckerEngine.run({
      url: "https://example.com/some/deep/path?q=1",
    })
    expect(requested).toBe("https://example.com/robots.txt")
    const output = result.output
    expect(output.robotsUrl).toBe("https://example.com/robots.txt")
    expect(output.parsed.groups).toHaveLength(2)
    expect(output.parsed.groups[0].disallow).toEqual(["/private/"])
    expect(output.parsed.sitemaps).toEqual(["https://example.com/sitemap.xml"])
    expect(output.warnings).toHaveLength(0)
  })

  it("warns on 404 responses", async () => {
    setNetworkFetcher(
      async () =>
        new Response("Not Found", { status: 404, headers: { "content-type": "text/html" } })
    )
    const result = await robotsTxtCheckerEngine.run({ url: "https://example.com/" })
    expect(result.output.status).toBe(404)
    expect(result.output.warnings.some((w) => w.includes("404"))).toBe(true)
    expect(result.output.warnings.some((w) => w.includes("text/html"))).toBe(true)
  })

  it("flags HTML-served robots.txt with a warning", async () => {
    setNetworkFetcher(
      async () =>
        new Response("<html>not robots</html>", {
          status: 200,
          headers: { "content-type": "text/html" },
        })
    )
    const result = await robotsTxtCheckerEngine.run({ url: "https://example.com/" })
    expect(result.output.warnings[0]).toContain("text/html")
  })

  it("rejects unreachable sites with the CORS-safe message", async () => {
    setNetworkFetcher(async () => {
      throw new TypeError("Failed to fetch")
    })
    await expect(robotsTxtCheckerEngine.run({ url: "https://blocked.example" })).rejects.toThrow(
      /does not allow browser-based cross-origin/
    )
  })

  it("rejects non-http schemes before any request", async () => {
    await expect(robotsTxtCheckerEngine.run({ url: "javascript:alert(1)" })).rejects.toThrow(
      /Protocol "javascript:" is not supported/
    )
  })
})
