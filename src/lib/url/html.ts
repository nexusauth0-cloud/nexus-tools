/**
 * Untrusted-HTML analysis via DOMParser.
 *
 * Fetched HTML is parsed with DOMParser only — scripts never execute,
 * images never load, and nothing is ever injected into the live DOM
 * (no innerHTML, no dangerouslySetInnerHTML). Only the extracted
 * fields are returned.
 */

export interface HeadMeta {
  title: string | null
  titleLength: number
  description: string | null
  descriptionLength: number
  canonical: string | null
  robots: string | null
  viewport: string | null
  charset: string | null
  lang: string | null
  favicon: string | null
}

export interface OpenGraphMeta {
  title: string | null
  description: string | null
  image: string | null
  url: string | null
  type: string | null
  siteName: string | null
}

export interface TwitterMeta {
  card: string | null
  title: string | null
  description: string | null
  image: string | null
}

export interface HtmlAnalysis {
  head: HeadMeta
  og: OpenGraphMeta
  twitter: TwitterMeta
  h1Count: number
  h2Count: number
  h3Count: number
  /** Number of application/ld+json blocks found. */
  jsonLdBlockCount: number
  /** Caught the string "schema.org" in any JSON-LD block. */
  hasSchemaOrg: boolean
}

function textOf(element: Element | null): string | null {
  const text = element?.textContent?.trim()
  return text && text.length > 0 ? text : null
}

function metaContent(doc: Document, attribute: "name" | "property", key: string): string | null {
  for (const element of Array.from(doc.querySelectorAll<HTMLMetaElement>(`meta[${attribute}]`))) {
    const value = element.getAttribute(attribute)
    if (value && value.toLowerCase() === key.toLowerCase()) {
      return element.getAttribute("content")?.trim() || null
    }
  }
  return null
}

export function parseHtml(html: string): Document {
  const doc = new DOMParser().parseFromString(html, "text/html")
  if (!doc.querySelector("html")) throw new Error("Unable to parse this page as HTML.")
  return doc
}

/**
 * Extracts every field the Meta Tag Analyzer reports. All selectors
 * operate on the parsed (inert) document — untrusted markup never
 * touches the live DOM.
 */
export function analyzeHtml(html: string): HtmlAnalysis {
  const doc = parseHtml(html)
  const root = doc.documentElement

  const title = textOf(doc.querySelector("title"))
  const description = metaContent(doc, "name", "description")
  const robots = metaContent(doc, "name", "robots")
  const viewport = metaContent(doc, "name", "viewport")
  const charset = doc.querySelector("meta[charset]")?.getAttribute("charset")?.trim() || null

  const canonical =
    doc.querySelector<HTMLLinkElement>('link[rel~="canonical"]')?.getAttribute("href") ?? null
  const favicon =
    doc
      .querySelector<HTMLLinkElement>('link[rel~="icon"], link[rel~="shortcut"], link[rel*="icon"]')
      ?.getAttribute("href") ?? null

  const og: OpenGraphMeta = {
    title: metaContent(doc, "property", "og:title"),
    description: metaContent(doc, "property", "og:description"),
    image: metaContent(doc, "property", "og:image"),
    url: metaContent(doc, "property", "og:url"),
    type: metaContent(doc, "property", "og:type"),
    siteName: metaContent(doc, "property", "og:site_name"),
  }

  const twitter: TwitterMeta = {
    card: metaContent(doc, "name", "twitter:card"),
    title: metaContent(doc, "name", "twitter:title"),
    description: metaContent(doc, "name", "twitter:description"),
    image: metaContent(doc, "name", "twitter:image"),
  }

  let jsonLdBlockCount = 0
  let hasSchemaOrg = false
  for (const script of Array.from(doc.querySelectorAll('script[type="application/ld+json"]'))) {
    jsonLdBlockCount += 1
    const content = script.textContent ?? ""
    if (content.includes("schema.org")) hasSchemaOrg = true
  }

  return {
    head: {
      title,
      titleLength: title?.length ?? 0,
      description,
      descriptionLength: description?.length ?? 0,
      canonical,
      robots,
      viewport,
      charset,
      lang: root.getAttribute("lang"),
      favicon,
    },
    og,
    twitter,
    h1Count: doc.querySelectorAll("h1").length,
    h2Count: doc.querySelectorAll("h2").length,
    h3Count: doc.querySelectorAll("h3").length,
    jsonLdBlockCount,
    hasSchemaOrg,
  }
}
