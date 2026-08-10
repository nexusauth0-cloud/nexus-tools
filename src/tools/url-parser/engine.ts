import { z } from "zod"
import { createToolEngine, summarize, ToolExecutionError } from "@/lib/tool-engine"
import { validateUrl, urlWithoutCredentials, TRACKING_PARAMETERS } from "@/lib/url/validate"

/**
 * URL Parser engine — fully client-side, zero network.
 *
 * Never stores credentials: the output carries a credential-stripped
 * URL and only *flags* the presence of a username/password. History
 * summaries contain the hostname only.
 */

const schema = z.object({
  url: z.string().min(1, "Enter a URL."),
})

export interface UrlParameter {
  key: string
  /** Empty string when the value is present but empty. */
  value: string
  /** Position of this occurrence among same-key params. */
  occurrence: number
}

export interface UrlParserOutput {
  /** Credential-stripped, normalized URL (safe to display). */
  url: string
  protocol: string
  usernamePresent: boolean
  passwordPresent: boolean
  hostname: string
  port: string | null
  pathname: string
  search: string
  hash: string
  origin: string
  params: UrlParameter[]
  /** Keys that appear more than once. */
  duplicateKeys: string[]
  /** Number of parameter values left empty. */
  emptyValueCount: number
  trackingParams: string[]
  /** Params were NOT removed — this is just informational. */
  trackingNotice: string
}

/** Remove tracking parameters and return the rebuilt URL (no credentials). */
export function rebuildUrlWithoutTracking(
  input: string | URL,
  tracking: readonly string[]
): { url: string; removed: string[] } {
  const url = typeof input === "string" ? new URL(input) : new URL(input.href)
  const search = new URLSearchParams(url.search)
  const removed: string[] = []
  for (const [key] of [...search.entries()]) {
    if (tracking.includes(key.toLowerCase())) {
      removed.push(key)
      search.delete(key)
    }
  }
  const clean = urlWithoutCredentials(url)
  const rebuilt = new URL(clean)
  rebuilt.search = search.toString()
  return { url: rebuilt.href, removed }
}

export const urlParserEngine = createToolEngine<typeof schema, UrlParserOutput>({
  toolId: "url-parser",
  schema,
  process: ({ url }) => {
    const validated = validateUrl(url)
    if (!validated.ok || !validated.url) {
      throw new ToolExecutionError("VALIDATION", validated.reason ?? "This URL is not valid.")
    }
    const parsed = validated.url

    const paramEntries = [...new URLSearchParams(parsed.search).entries()]
    const seen = new Map<string, number>()
    const params: UrlParameter[] = paramEntries.map(([key, value]) => {
      const occurrence = seen.get(key) ?? 0
      seen.set(key, occurrence + 1)
      return { key, value, occurrence }
    })

    const duplicateKeys = [...seen.entries()].filter(([, count]) => count > 1).map(([key]) => key)
    const emptyValueCount = params.filter((param) => param.value === "").length
    const trackingParams = params
      .map((param) => param.key)
      .filter((key) => (TRACKING_PARAMETERS as readonly string[]).includes(key.toLowerCase()))

    return {
      url: urlWithoutCredentials(parsed),
      protocol: parsed.protocol,
      usernamePresent: parsed.username.length > 0,
      passwordPresent: parsed.password.length > 0,
      hostname: parsed.hostname,
      port: parsed.port || null,
      pathname: parsed.pathname,
      search: parsed.search,
      hash: parsed.hash,
      origin: parsed.origin,
      params,
      duplicateKeys,
      emptyValueCount,
      trackingParams,
      trackingNotice:
        "Tracking parameters are detected but never removed automatically — remove them only when you ask for it.",
    }
  },
  summarize: {
    input: (value) => {
      const validated = validateUrl(value.url)
      return summarize(`URL: ${validated.ok && validated.url ? validated.url.hostname : "unknown"}`)
    },
    output: (value) =>
      summarize(
        `${value.hostname} · ${value.params.length} parameter${value.params.length === 1 ? "" : "s"}${value.duplicateKeys.length ? ` · ${value.duplicateKeys.length} duplicate key(s)` : ""}`
      ),
  },
})
