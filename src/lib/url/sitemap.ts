/**
 * Sitemap XML analysis via DOMParser.
 *
 * Untrusted XML is parsed with DOMParser only: external entities are
 * never resolved and nothing inside the document is ever fetched. Both
 * `urlset` and `sitemapindex` documents are supported; findings speak
 * of structural validation, never "approval" by any search engine.
 */

export type SitemapViolationKind =
  "missing-loc" | "duplicate-loc" | "invalid-loc" | "invalid-priority" | "invalid-changefreq"

export interface SitemapViolation {
  kind: SitemapViolationKind
  /** URL the violation concerns (may be absent for structural issues). */
  url?: string
  detail: string
}

export interface SitemapEntry {
  loc: string
  lastmod: string | null
  changefreq: string | null
  priority: string | null
}

export interface SitemapParseResult {
  ok: boolean
  /** "parsing-failed" when the XML could not be parsed. */
  error?: string
  /** "urlset" | "sitemapindex" | "unknown" (still analyzed leniently). */
  root: "urlset" | "sitemapindex" | "unknown"
  entries: SitemapEntry[]
  directoryCount: number
  sitemapCount: number
  lastmodCount: number
  changefreqCount: number
  priorityCount: number
  violations: SitemapViolation[]
  duplicateCount: number
  missingLocCount: number
  invalidLocCount: number
  invalidPriorityCount: number
  invalidChangefreqCount: number
}

/** As listed in the sitemaps.org schema. */
const VALID_CHANGEFREQ = new Set([
  "always",
  "hourly",
  "daily",
  "weekly",
  "monthly",
  "yearly",
  "never",
])

function elementsByLocalName(doc: Document, localName: string): Element[] {
  return Array.from(doc.getElementsByTagName("*")).filter(
    (element) => element.localName.toLowerCase() === localName
  )
}

function childText(parent: Element, localName: string): string | null {
  for (const child of Array.from(parent.children)) {
    if (child.localName.toLowerCase() === localName) {
      const text = child.textContent?.trim()
      return text && text.length > 0 ? text : null
    }
  }
  return null
}

function isValidAbsoluteHttpUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return url.protocol === "http:" || url.protocol === "https:"
  } catch {
    return false
  }
}

function priorityValid(value: string): boolean {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed >= 0 && parsed <= 1 && /^\d+(\.\d+)?$/.test(value.trim())
}

export interface ParseSitemapOptions {
  /** Return at most this many violations (UI keeps results bounded). */
  maxViolations?: number
}

function failureResult(error: string): SitemapParseResult {
  return {
    ok: false,
    error,
    root: "unknown",
    entries: [],
    directoryCount: 0,
    sitemapCount: 0,
    lastmodCount: 0,
    changefreqCount: 0,
    priorityCount: 0,
    violations: [],
    duplicateCount: 0,
    missingLocCount: 0,
    invalidLocCount: 0,
    invalidPriorityCount: 0,
    invalidChangefreqCount: 0,
  }
}

export function parseSitemapXml(
  xml: string,
  options: ParseSitemapOptions = {}
): SitemapParseResult {
  const maxViolations = options.maxViolations ?? 200
  let doc: Document
  try {
    doc = new DOMParser().parseFromString(xml, "application/xml")
  } catch {
    return failureResult("The XML could not be parsed.")
  }

  if (doc.getElementsByTagName("parsererror").length > 0) {
    return failureResult("The XML could not be parsed.")
  }

  const rootEl = doc.documentElement
  const rootName = rootEl ? rootEl.localName.toLowerCase() : ""
  const root: SitemapParseResult["root"] =
    rootName === "urlset" ? "urlset" : rootName === "sitemapindex" ? "sitemapindex" : "unknown"

  const entries: SitemapEntry[] = []
  const violations: SitemapViolation[] = []
  const seen = new Set<string>()
  let duplicateCount = 0
  let missingLocCount = 0
  let invalidLocCount = 0
  let invalidPriorityCount = 0
  let invalidChangefreqCount = 0
  let directoryCount = 0
  let lastmodCount = 0
  let changefreqCount = 0
  let priorityCount = 0

  const addViolation = (violation: SitemapViolation) => {
    if (violations.length < maxViolations) violations.push(violation)
  }

  const itemLocalName = root === "sitemapindex" ? "sitemap" : "url"
  for (const item of elementsByLocalName(doc, itemLocalName)) {
    if (
      item.parentElement &&
      root !== "unknown" &&
      item.parentElement.localName.toLowerCase() !== rootName
    ) {
      continue
    }

    const loc = childText(item, "loc")
    const lastmod = childText(item, "lastmod")
    const changefreq = childText(item, "changefreq")
    const priority = childText(item, "priority")
    if (loc) entries.push({ loc, lastmod, changefreq, priority })
    if (lastmod) lastmodCount += 1
    if (changefreq) changefreqCount += 1
    if (priority) priorityCount += 1

    if (!loc) {
      missingLocCount += 1
      addViolation({ kind: "missing-loc", detail: "A <loc> element is missing from this item." })
      continue
    }
    if (!isValidAbsoluteHttpUrl(loc)) {
      invalidLocCount += 1
      addViolation({ kind: "invalid-loc", url: loc, detail: "Not an absolute http(s) URL." })
    }
    const key = loc.trim()
    if (seen.has(key)) {
      duplicateCount += 1
      addViolation({ kind: "duplicate-loc", url: loc, detail: "This URL appears more than once." })
    } else {
      seen.add(key)
    }

    if (priority && !priorityValid(priority)) {
      invalidPriorityCount += 1
      addViolation({
        kind: "invalid-priority",
        url: loc,
        detail: `Priority "${priority}" is outside 0.0–1.0.`,
      })
    }
    if (changefreq && !VALID_CHANGEFREQ.has(changefreq.toLowerCase())) {
      invalidChangefreqCount += 1
      addViolation({
        kind: "invalid-changefreq",
        url: loc,
        detail: `Changefreq "${changefreq}" is not a valid value.`,
      })
    }
  }

  directoryCount = root === "sitemapindex" ? entries.length : 0

  return {
    ok: true,
    root,
    entries,
    directoryCount,
    sitemapCount: root === "sitemapindex" ? entries.length : 0,
    lastmodCount,
    changefreqCount,
    priorityCount,
    violations,
    duplicateCount,
    missingLocCount,
    invalidLocCount,
    invalidPriorityCount,
    invalidChangefreqCount,
  }
}
