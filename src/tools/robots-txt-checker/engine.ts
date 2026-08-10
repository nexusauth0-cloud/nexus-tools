import { z } from "zod"
import { createToolEngine, summarize, ToolExecutionError } from "@/lib/tool-engine"
import { validateUrl, robotsUrlFor } from "@/lib/url/validate"
import { fetchResource, decodeUtf8, toNetworkToolError } from "@/lib/url/fetch"
import { parseRobots, type RobotsParseResult } from "@/lib/url/robots"
import { MAX_ROBOTS_BYTES, REQUEST_TIMEOUT_MS } from "@/lib/url/constants"

/**
 * Robots.txt Checker engine.
 *
 * Always requests the site's root /robots.txt — derived from the
 * origin, so no user-supplied path can be injected. Findings are
 * structural guidance; the UI explains that robots.txt is not an
 * access-control mechanism.
 */

const schema = z.object({
  url: z.string().min(1, "Enter a URL."),
})

export interface RobotsCheckerOutput {
  /** The site URL given by the user (normalized, credentials stripped). */
  siteUrl: string
  /** The robots.txt URL actually requested (origin + /robots.txt). */
  robotsUrl: string
  status: number
  contentType: string | null
  sizeBytes: number
  truncated: boolean
  warnings: string[]
  parsed: RobotsParseResult
}

export const robotsTxtCheckerEngine = createToolEngine<typeof schema, RobotsCheckerOutput>({
  toolId: "robots-txt-checker",
  schema,
  process: async ({ url }) => {
    const validated = validateUrl(url)
    if (!validated.ok || !validated.url) {
      throw new ToolExecutionError("VALIDATION", validated.reason ?? "This URL is not valid.")
    }
    const robotsUrl = robotsUrlFor(validated.url)

    let resource
    try {
      resource = await fetchResource({
        url: robotsUrl.href,
        timeoutMs: REQUEST_TIMEOUT_MS,
        maxBytes: MAX_ROBOTS_BYTES,
      })
    } catch (error) {
      throw toNetworkToolError(error)
    }

    const warnings: string[] = []
    if (!resource.contentType || resource.contentType.startsWith("text/html")) {
      warnings.push(
        `The response was ${resource.contentType ?? "no content type"} — robots.txt is normally served as text/plain.`
      )
    }
    if (resource.status === 404) {
      warnings.push("The site returned 404 — it may have no robots.txt at all.")
    }

    const parsed = parseRobots(decodeUtf8(resource.bytes))

    return {
      siteUrl: validated.url.href,
      robotsUrl: robotsUrl.href,
      status: resource.status,
      contentType: resource.contentType,
      sizeBytes: resource.bytes.length,
      truncated: resource.truncated,
      warnings,
      parsed,
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
        `${value.parsed.groups.length} user-agent group${value.parsed.groups.length === 1 ? "" : "s"} · ${value.parsed.sitemaps.length} sitemap reference${value.parsed.sitemaps.length === 1 ? "" : "s"} · ${value.parsed.issues.length} issue${value.parsed.issues.length === 1 ? "" : "s"}`
      ),
  },
})
