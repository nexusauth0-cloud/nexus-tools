import { z } from "zod"
import { createToolEngine, summarize, ToolExecutionError } from "@/lib/tool-engine"
import { validateUrl } from "@/lib/url/validate"
import { fetchResource, decodeUtf8, isBinaryMime, toNetworkToolError } from "@/lib/url/fetch"
import { analyzeHtml, type HtmlAnalysis } from "@/lib/url/html"
import { MAX_HTML_BYTES, REQUEST_TIMEOUT_MS } from "@/lib/url/constants"

/**
 * Meta Tag Analyzer engine.
 *
 * Fetches a page with the browser-native bounded fetch and analyzes
 * only the extracted fields — never the raw page itself (no body text
 * is stored, displayed, or logged). Recommendations are worded as
 * guidance: they describe conventions for discoverability, not laws
 * and not guarantees.
 */

const schema = z.object({
  url: z.string().min(1, "Enter a URL."),
})

export type MetaFlagKind = "pass" | "warn" | "info"

export interface MetaFlag {
  kind: MetaFlagKind
  /** What was actually observed (a fact, not an opinion). */
  fact: string
  /** Guidance phrased as a suggestion, separated from the fact. */
  recommendation?: string
}

export interface MetaAnalyzerOutput {
  /** Normalized input URL without credentials. */
  url: string
  /** Final URL after the browser's native redirect handling. */
  finalUrl: string
  status: number
  contentType: string | null
  sizeBytes: number
  truncated: boolean
  warnings: string[]
  analysis: HtmlAnalysis
  flags: MetaFlag[]
  /** True when the page content was not HTML and couldn't be meaningfully analyzed. */
  notAnalyzed: boolean
}

const TITLE_RECOMMENDATIONS = [
  {
    label: "short",
    max: 30,
    fact: (n: number) => `The title is ${n} characters — shorter than the typical 30–60.`,
    recommendation: "Consider a more descriptive title that says what the page is about.",
  },
  {
    label: "long",
    min: 60,
    fact: (n: number) => `The title is ${n} characters — longer than the typical 30–60.`,
    recommendation: "Consider trimming the title; search engines may cut off long ones in results.",
  },
] as const

function titleFlags(title: string | null): MetaFlag[] {
  if (!title) {
    return [
      {
        kind: "warn",
        fact: "No title element was found.",
        recommendation: "Consider adding a descriptive <title> to the page.",
      },
    ]
  }
  const length = title.length
  if (length < 20) {
    const rule = TITLE_RECOMMENDATIONS.find((r) => r.label === "short")
    return rule
      ? [{ kind: "info", fact: rule.fact(length), recommendation: rule.recommendation }]
      : []
  }
  if (length > 60) {
    const rule = TITLE_RECOMMENDATIONS.find((r) => r.label === "long")
    return rule
      ? [{ kind: "info", fact: rule.fact(length), recommendation: rule.recommendation }]
      : []
  }
  return []
}

function descriptionFlags(description: string | null): MetaFlag[] {
  if (!description) {
    return [
      {
        kind: "warn",
        fact: "No meta description was found.",
        recommendation: "Consider adding a concise meta description.",
      },
    ]
  }
  const length = description.length
  if (length < 70) {
    return [
      {
        kind: "info",
        fact: `The meta description is ${length} characters — shorter than the typical 70–160.`,
        recommendation: "Consider expanding it to summarise the page more fully.",
      },
    ]
  }
  if (length > 160) {
    return [
      {
        kind: "info",
        fact: `The meta description is ${length} characters — longer than the typical 70–160.`,
        recommendation: "Consider trimming it so it reads well in search results.",
      },
    ]
  }
  return []
}

export const metaTagAnalyzerEngine = createToolEngine<typeof schema, MetaAnalyzerOutput>({
  toolId: "meta-tag-analyzer",
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
        timeoutMs: REQUEST_TIMEOUT_MS,
        maxBytes: MAX_HTML_BYTES,
      })
    } catch (error) {
      throw toNetworkToolError(error)
    }

    const warnings: string[] = []
    const contentType = resource.contentType
    if (isBinaryMime(resource.mime)) {
      return {
        url: validated.url.href,
        finalUrl: resource.finalUrl,
        status: resource.status,
        contentType,
        sizeBytes: resource.bytes.length,
        truncated: resource.truncated,
        warnings: [
          `The response was ${resource.mime || "binary"} rather than HTML, so no tags could be analyzed.`,
        ],
        analysis: emptyHtmlAnalysis(),
        flags: [],
        notAnalyzed: true,
      }
    }
    if (contentType && resource.mime !== "text/html" && resource.mime !== "application/xhtml+xml") {
      warnings.push(
        `The response's content type is "${resource.mime || "unknown"}" rather than text/html — tags were parsed anyway.`
      )
    }

    const html = decodeUtf8(resource.bytes)
    const analysis = analyzeHtml(html)

    const flags: MetaFlag[] = [
      ...titleFlags(analysis.head.title),
      ...descriptionFlags(analysis.head.description),
      ...(!analysis.head.canonical
        ? [
            {
              kind: "warn" as const,
              fact: 'No <link rel="canonical"> was found.',
              recommendation:
                "Consider adding a canonical URL if the page is reachable at multiple addresses.",
            },
          ]
        : []),
      ...(analysis.h1Count > 1
        ? [
            {
              kind: "info" as const,
              fact: `${analysis.h1Count} <h1> elements were found.`,
              recommendation: "Consider using a single <h1> per page to keep the outline clear.",
            },
          ]
        : []),
      ...(!analysis.head.viewport
        ? [
            {
              kind: "warn" as const,
              fact: "No viewport meta tag was found.",
              recommendation: "Consider adding a viewport meta so the page renders well on mobile.",
            },
          ]
        : []),
      ...(!analysis.head.lang
        ? [
            {
              kind: "info" as const,
              fact: "No lang attribute was found on <html>.",
              recommendation:
                "Consider declaring the page language for accessibility and translation tools.",
            },
          ]
        : []),
    ]

    return {
      url: validated.url.href,
      finalUrl: resource.finalUrl,
      status: resource.status,
      contentType,
      sizeBytes: resource.bytes.length,
      truncated: resource.truncated,
      warnings,
      analysis,
      flags,
      notAnalyzed: false,
    }
  },
  summarize: {
    input: (value) => {
      const validated = validateUrl(value.url)
      return summarize(
        `Website: ${validated.ok && validated.url ? validated.url.hostname : "unknown"}`
      )
    },
    output: (value) =>
      summarize(
        value.notAnalyzed
          ? "Unsupported content type — no tags analyzed"
          : `${value.analysis.head.title ? "Title present" : "No title"} · ${value.analysis.head.description ? "description present" : "no description"} · ${value.analysis.h1Count} h1 · ${value.analysis.jsonLdBlockCount} JSON-LD block(s)`
      ),
  },
})

function emptyHtmlAnalysis(): HtmlAnalysis {
  return {
    head: {
      title: null,
      titleLength: 0,
      description: null,
      descriptionLength: 0,
      canonical: null,
      robots: null,
      viewport: null,
      charset: null,
      lang: null,
      favicon: null,
    },
    og: { title: null, description: null, image: null, url: null, type: null, siteName: null },
    twitter: { card: null, title: null, description: null, image: null },
    h1Count: 0,
    h2Count: 0,
    h3Count: 0,
    jsonLdBlockCount: 0,
    hasSchemaOrg: false,
  }
}
