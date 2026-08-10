import { z } from "zod"
import { createToolEngine, summarize, ToolExecutionError } from "@/lib/tool-engine"
import { validateUrl } from "@/lib/url/validate"
import { fetchResource, decodeUtf8, toNetworkToolError } from "@/lib/url/fetch"
import { parseSitemapXml, type SitemapParseResult } from "@/lib/url/sitemap"
import {
  MAX_SITEMAP_BYTES,
  SITEMAP_TIMEOUT_MS,
  MAX_SAMPLE_URLS,
  MAX_VIOLATIONS,
} from "@/lib/url/constants"

/**
 * Sitemap Checker engine.
 *
 * Parses one sitemap document (urlset or sitemapindex) without
 * resolving anything inside it. Nested sitemaps are never crawled —
 * findings describe the document's own structure and validity.
 */

const schema = z.object({
  url: z.string().min(1, "Enter a URL."),
})

export interface SitemapCheckerOutput {
  url: string
  finalUrl: string
  status: number
  contentType: string | null
  sizeBytes: number
  truncated: boolean
  warnings: string[]
  /** Sample of located URLs (capped) — enough for a preview, never a dump. */
  sampleUrls: string[]
  parsed: SitemapParseResult
}

export const sitemapCheckerEngine = createToolEngine<typeof schema, SitemapCheckerOutput>({
  toolId: "sitemap-checker",
  schema,
  process: async ({ url }) => {
    const validated = validateUrl(url)
    if (!validated.ok || !validated.url) {
      throw new ToolExecutionError("VALIDATION", validated.reason ?? "This URL is not valid.")
    }

    let resource
    try {
      resource = await fetchResource({
        url: validated.url.href,
        timeoutMs: SITEMAP_TIMEOUT_MS,
        maxBytes: MAX_SITEMAP_BYTES,
      })
    } catch (error) {
      throw toNetworkToolError(error)
    }

    const warnings: string[] = []
    const mime = resource.mime
    if (
      mime &&
      mime !== "application/xml" &&
      mime !== "text/xml" &&
      mime !== "application/x-xml" &&
      !mime.includes("xml")
    ) {
      warnings.push(
        `The response's content type is "${mime}" rather than XML — the content was parsed anyway.`
      )
    }
    if (resource.truncated) {
      warnings.push(
        `The sitemap exceeded the ${Math.round(MAX_SITEMAP_BYTES / (1024 * 1024))} MB analysis limit and was truncated before the end.`
      )
    }

    const parsed = parseSitemapXml(decodeUtf8(resource.bytes), { maxViolations: MAX_VIOLATIONS })
    if (!parsed.ok) {
      return {
        url: validated.url.href,
        finalUrl: resource.finalUrl,
        status: resource.status,
        contentType: resource.contentType,
        sizeBytes: resource.bytes.length,
        truncated: resource.truncated,
        warnings: [...warnings, parsed.error ?? "The XML could not be parsed."],
        sampleUrls: [],
        parsed,
      }
    }

    return {
      url: validated.url.href,
      finalUrl: resource.finalUrl,
      status: resource.status,
      contentType: resource.contentType,
      sizeBytes: resource.bytes.length,
      truncated: resource.truncated,
      warnings,
      sampleUrls: parsed.entries.slice(0, MAX_SAMPLE_URLS).map((entry) => entry.loc),
      parsed,
    }
  },
  summarize: {
    input: (value) => {
      const validated = validateUrl(value.url)
      return summarize(
        `Sitemap: ${validated.ok && validated.url ? validated.url.hostname : "unknown"}`
      )
    },
    output: (value) =>
      value.parsed.ok
        ? summarize(
            `${value.parsed.root === "sitemapindex" ? "Index" : "Urlset"} · ${value.parsed.entries.length} item${value.parsed.entries.length === 1 ? "" : "s"} · ${value.parsed.violations.length} issue${value.parsed.violations.length === 1 ? "" : "s"}`
          )
        : "Sitemap could not be parsed",
  },
})
