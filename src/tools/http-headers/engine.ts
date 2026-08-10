import { z } from "zod"
import { createToolEngine, summarize, ToolExecutionError } from "@/lib/tool-engine"
import { validateUrl } from "@/lib/url/validate"
import { fetchHeadersOnly, toNetworkToolError } from "@/lib/url/fetch"
import { HEADERS_TIMEOUT_MS, CHECKED_HEADERS } from "@/lib/url/constants"

/**
 * HTTP Headers Checker engine.
 *
 * Reads only response headers and immediately cancels the body stream —
 * nothing is downloaded. Only headers the browser actually exposes
 * (same-origin or CORS-exposed) are reported; inaccessible headers are
 * labelled as such rather than fabricated.
 */

const schema = z.object({
  url: z.string().min(1, "Enter a URL."),
})

export interface HeaderFinding {
  /** Header name in display case, e.g. "Content-Security-Policy". */
  name: string
  /**
   * "exposed" — the browser could read it.
   * "missing" — the server didn't send it (as far as the browser can see).
   * "not-exposed" — the server may send it, but the browser can't read it.
   */
  state: "exposed" | "missing" | "not-exposed"
  value?: string
}

export interface HeadersCheckerOutput {
  url: string
  finalUrl: string
  status: number
  statusText: string | null
  findings: HeaderFinding[]
  /** Security-header guidance based purely on what the browser could see. */
  recommendations: string[]
  note: string
}

const SECURITY_GUIDANCE: Record<string, string> = {
  "content-security-policy":
    "Consider an explicit Content-Security-Policy to limit what the page can load.",
  "strict-transport-security":
    "Consider Strict-Transport-Security so connections stay locked to HTTPS.",
  "x-content-type-options": "Consider X-Content-Type-Options: nosniff to prevent MIME-sniffing.",
  "referrer-policy": "Consider a Referrer-Policy to control how much of the page URL is shared.",
  "permissions-policy": "Consider a Permissions-Policy to restrict browser feature access.",
  "cross-origin-opener-policy":
    "Consider Cross-Origin-Opener-Policy to isolate the browsing context.",
  "cross-origin-resource-policy":
    "Consider Cross-Origin-Resource-Policy to control resource sharing.",
  "cross-origin-embedder-policy":
    "Consider Cross-Origin-Embedder-Policy if the page needs strong isolation.",
}

/** "content-security-policy" → "Content-Security-Policy". */
function displayCase(name: string): string {
  return name
    .split("-")
    .map((part) => (part ? part.charAt(0).toUpperCase() + part.slice(1) : part))
    .join("-")
}

export const httpHeadersEngine = createToolEngine<typeof schema, HeadersCheckerOutput>({
  toolId: "http-headers",
  schema,
  process: async ({ url }) => {
    const validated = validateUrl(url)
    if (!validated.ok || !validated.url) {
      throw new ToolExecutionError("VALIDATION", validated.reason ?? "This URL is not valid.")
    }

    let result
    try {
      result = await fetchHeadersOnly({
        url: validated.url.href,
        timeoutMs: HEADERS_TIMEOUT_MS,
        maxBytes: 1,
      })
    } catch (error) {
      throw toNetworkToolError(error)
    }

    const findings: HeaderFinding[] = CHECKED_HEADERS.map((name) => {
      const value = result.headers[name]
      if (value !== undefined) {
        return { name: displayCase(name), state: "exposed", value }
      }
      return {
        name: displayCase(name),
        state: "missing",
      }
    })

    const recommendations: string[] = []
    for (const name of CHECKED_HEADERS) {
      if (result.headers[name] === undefined && SECURITY_GUIDANCE[name]) {
        recommendations.push(SECURITY_GUIDANCE[name])
      }
    }

    return {
      url: validated.url.href,
      finalUrl: result.finalUrl,
      status: result.status,
      statusText: result.statusText,
      findings,
      recommendations,
      note:
        "Only headers the server exposes to the browser are listed — " +
        "headers are readable only when the target allows cross-origin access. " +
        "A missing entry may still be sent by the server but hidden from browsers.",
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
        `Status ${value.status} · ${value.findings.filter((f) => f.state === "exposed").length} header(s) readable from the browser`
      ),
  },
})
