/**
 * robots.txt parser — strict on structure, honest about the rest.
 *
 * robots.txt expresses crawler *guidance*, not access control (and this
 * is stated in the UI). Unknown/non-standard directives and structurally
 * malformed lines are reported as such instead of being silently treated
 * as valid.
 */

export interface RobotsRuleGroup {
  /** Lower-cased user-agent the directives apply to (explicit or "*"). */
  userAgent: string
  allow: string[]
  disallow: string[]
  /** Present only when a valid Crawl-delay was set for this group. */
  crawlDelay: number | null
}

export interface RobotsIssue {
  line: number
  /** Raw line, truncated for display. */
  raw: string
  issue: "malformed" | "unrecognized" | "before-first-agent" | "invalid-crawl-delay"
  detail?: string
}

export interface RobotsParseResult {
  groups: RobotsRuleGroup[]
  /** Global Sitemap: directives (any casing). */
  sitemaps: string[]
  /** Global Host: directives (deprecated but reported). */
  hosts: string[]
  issues: RobotsIssue[]
  /** Raw line + comment/blank counts (for the summary). */
  lines: number
  comments: number
  blankLines: number
  /** True when the file declared "*" (applies to all crawlers). */
  hasWildcardGroup: boolean
}

const KNOWN_DIRECTIVES = new Set([
  "user-agent",
  "allow",
  "disallow",
  "sitemap",
  "crawl-delay",
  "host",
])

function stripComment(line: string): string {
  const hash = line.indexOf("#")
  return hash === -1 ? line : line.slice(0, hash)
}

export function parseRobots(text: string): RobotsParseResult {
  const groups: RobotsRuleGroup[] = []
  const sitemaps: string[] = []
  const hosts: string[] = []
  const issues: RobotsIssue[] = []
  let current: RobotsRuleGroup | null = null
  let lines = 0
  let comments = 0
  let blankLines = 0

  const addIssue = (issue: RobotsIssue) => {
    if (issues.length < 200) issues.push(issue)
  }

  const ensureGroup = (userAgent: string): RobotsRuleGroup => {
    const existing = groups.find((group) => group.userAgent === userAgent)
    if (existing) return existing
    const created: RobotsRuleGroup = {
      userAgent,
      allow: [],
      disallow: [],
      crawlDelay: null,
    }
    groups.push(created)
    return created
  }

  for (const rawLine of text.split(/\r?\n/)) {
    lines += 1
    if (rawLine.trim() === "") {
      blankLines += 1
      continue
    }
    if (rawLine.trim().startsWith("#")) {
      comments += 1
      continue
    }
    const line = stripComment(rawLine).trim()
    if (line === "") continue

    const colon = line.indexOf(":")
    if (colon === -1) {
      addIssue({ line: lines, raw: rawLine.trim().slice(0, 120), issue: "malformed" })
      continue
    }

    const directive = line.slice(0, colon).trim().toLowerCase()
    const value = line.slice(colon + 1).trim()

    if (!KNOWN_DIRECTIVES.has(directive)) {
      addIssue({
        line: lines,
        raw: rawLine.trim().slice(0, 120),
        issue: "unrecognized",
        detail: directive,
      })
      continue
    }

    if (directive === "user-agent") {
      current = ensureGroup(value.toLowerCase())
      continue
    }
    if (directive === "sitemap") {
      if (value) sitemaps.push(value)
      continue
    }
    if (directive === "host") {
      if (value) hosts.push(value)
      continue
    }
    if (!current) {
      addIssue({
        line: lines,
        raw: rawLine.trim().slice(0, 120),
        issue: "before-first-agent",
        detail: directive,
      })
      continue
    }
    if (directive === "allow") {
      if (value) current.allow.push(value)
      continue
    }
    if (directive === "disallow") {
      if (value) current.disallow.push(value)
      continue
    }
    if (directive === "crawl-delay") {
      const seconds = Number(value)
      if (Number.isFinite(seconds) && seconds >= 0) {
        current.crawlDelay = seconds
      } else {
        addIssue({ line: lines, raw: rawLine.trim().slice(0, 120), issue: "invalid-crawl-delay" })
      }
    }
  }

  return {
    groups,
    sitemaps,
    hosts,
    issues,
    lines,
    comments,
    blankLines,
    hasWildcardGroup: groups.some((group) => group.userAgent === "*"),
  }
}
