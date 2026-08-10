import { describe, expect, it } from "vitest"
import { parseRobots } from "./robots"

const STANDARD = `# Welcome
User-agent: *
Allow: /public/
Disallow: /private/
Crawl-delay: 10

User-agent: Googlebot
Disallow: /admin

Sitemap: https://example.com/sitemap.xml
Host: https://example.com
`

describe("parseRobots", () => {
  it("parses user-agent groups with allow/disallow and crawl-delay", () => {
    const result = parseRobots(STANDARD)
    expect(result.groups).toHaveLength(2)
    const wildcard = result.groups[0]
    expect(wildcard.userAgent).toBe("*")
    expect(wildcard.allow).toEqual(["/public/"])
    expect(wildcard.disallow).toEqual(["/private/"])
    expect(wildcard.crawlDelay).toBe(10)
    expect(result.groups[1].userAgent).toBe("googlebot")
    expect(result.groups[1].disallow).toEqual(["/admin"])
    expect(result.hasWildcardGroup).toBe(true)
  })

  it("collects global Sitemap and Host directives", () => {
    const result = parseRobots(STANDARD)
    expect(result.sitemaps).toEqual(["https://example.com/sitemap.xml"])
    expect(result.hosts).toEqual(["https://example.com"])
  })

  it("treats lines without a colon as malformed", () => {
    const result = parseRobots("User-agent: *\nthis line is broken\nDisallow: /x")
    expect(result.issues).toHaveLength(1)
    expect(result.issues[0].issue).toBe("malformed")
  })

  it("flags unrecognized directives instead of accepting them", () => {
    const result = parseRobots("User-agent: *\nFrobnicate: yes\nDisallow: /")
    expect(result.issues[0]).toMatchObject({ issue: "unrecognized", detail: "frobnicate" })
  })

  it("flags directives that appear before any user-agent", () => {
    const result = parseRobots("Disallow: /everything\nUser-agent: *")
    expect(result.issues[0].issue).toBe("before-first-agent")
  })

  it("ignores comments and blank lines and counts them", () => {
    const result = parseRobots("# only a comment\n\n\nUser-agent: *\n")
    expect(result.lines).toBe(5)
    expect(result.comments).toBe(1)
    expect(result.blankLines).toBe(3)
    expect(result.groups).toHaveLength(1)
  })

  it("handles inline comments after directives", () => {
    const result = parseRobots("User-agent: * # all crawlers\nDisallow: /tmp # keep out")
    expect(result.groups[0].disallow).toEqual(["/tmp"])
  })

  it("keys groups case-insensitively", () => {
    const result = parseRobots("User-agent: GOOGLEBOT\nuser-agent: googlebot\nDisallow: /x")
    expect(result.groups).toHaveLength(1)
    expect(result.groups[0].disallow).toEqual(["/x"])
  })

  it("reports invalid crawl-delay values", () => {
    const result = parseRobots("User-agent: *\nCrawl-delay: banana")
    expect(result.issues[0].issue).toBe("invalid-crawl-delay")
  })

  it("strips trailing whitespace and handles CRLF", () => {
    const result = parseRobots("User-agent: *\r\nDisallow: /x \r\n")
    expect(result.groups[0].disallow).toEqual(["/x"])
  })

  it("caps issues at 200 entries", () => {
    const lines = Array.from({ length: 300 }, () => "orphan").join("\n")
    const result = parseRobots(lines)
    expect(result.issues.length).toBe(200)
  })
})
