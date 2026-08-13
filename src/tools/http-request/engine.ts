import { z } from "zod"
import { createToolEngine, ToolExecutionError } from "@/lib/tool-engine"
import { mapFetchError } from "@/lib/http"
import {
  buildRequestBody,
  HTTP_DEFAULT_TIMEOUT_MS,
  HTTP_MAX_BODY_CHARS,
  HTTP_MAX_HEADERS,
  HttpMethod,
  HttpRequestError,
  isSupportedMethod,
  validateHeaders,
  validateJsonBody,
  validateRequestUrl,
  validateTimeout,
} from "@/lib/http"

/**
 * HTTP Request Builder engine.
 *
 * Architecture: the browser makes the request directly with fetch from the
 * client component. There is NO server-side proxy, SSRF surface, or bypass
 * of browser security (CORS, CSP, mixed-content all apply). Timing is
 * measured by the engine. History records safe metadata only — method,
 * hostname, pathname (no query string), status, duration — never headers,
 * bodies, or credentials.
 */

const headerRow = z.object({
  name: z.string().max(128),
  value: z.string().max(4096),
})

const schema = z.object({
  method: z
    .string()
    .refine(isSupportedMethod, { message: "Unsupported HTTP method." })
    .default("GET"),
  url: z.string().max(8192).default(""),
  headers: z
    .array(headerRow)
    .max(HTTP_MAX_HEADERS, `Too many headers (max ${HTTP_MAX_HEADERS}).`)
    .default([]),
  bodyKind: z.enum(["none", "json", "text", "form"]).default("none"),
  body: z.string().max(HTTP_MAX_BODY_CHARS).default(""),
  timeoutMs: z.number().int().default(HTTP_DEFAULT_TIMEOUT_MS),
  /** Browser-side AbortSignal wired to the Cancel button. */
  signal: z.custom<AbortSignal>(),
})

export type HttpRequestBodyKind = "none" | "json" | "text" | "form"

export interface HttpRequestOutput {
  url: string
  method: HttpMethod
  status: number | null
  statusText: string
  durationMs: number
  responseHeaders: Array<{ name: string; value: string }>
  responseBody: string
  responseSizeBytes: number
  contentType: string
  /** True when the body was truncated for display (honest, never silent). */
  truncated: boolean
}

export const RESPONSE_DISPLAY_CAP = 250_000

export const httpRequestEngine = createToolEngine<typeof schema, HttpRequestOutput>({
  toolId: "http-request",
  schema,
  process: async (input) => {
    if (input.url.trim() === "") {
      throw new ToolExecutionError("VALIDATION", "Enter a request URL.")
    }

    let url: string
    let method: HttpMethod
    let cleanedHeaders: Array<{ name: string; value: string }>
    let timeoutMs: number
    try {
      url = validateRequestUrl(input.url)
      method = input.method as HttpMethod
      cleanedHeaders = validateHeaders(input.headers)
      timeoutMs = validateTimeout(input.timeoutMs)
    } catch (error) {
      throw asValidationError(error)
    }

    let body: string | null = null
    try {
      body = buildRequestBody(input.bodyKind, input.body)
      if (input.bodyKind === "json" && input.body.trim() !== "") {
        validateJsonBody(input.body)
      }
    } catch (error) {
      throw asValidationError(error)
    }

    let contentTypeHeader: string | undefined
    if (input.bodyKind === "json" && input.body.trim() !== "") {
      contentTypeHeader = "application/json"
    } else if (input.bodyKind === "form") {
      contentTypeHeader = "application/x-www-form-urlencoded"
    } else if (input.bodyKind === "text" && body !== null) {
      contentTypeHeader = "text/plain"
    }

    // Final Headers — user headers first, automatic content-type only when
    // the user did not already set one.
    const headers = new Headers()
    for (const header of cleanedHeaders) headers.set(header.name, header.value)
    if (contentTypeHeader && !headers.has("content-type")) {
      headers.set("content-type", contentTypeHeader)
    }

    // Cancel + timeout share one internal controller; the UI's signal
    // (Cancel button) forwards into it, and the timeout aborts it too.
    const controller = new AbortController()
    const externalSignal = input.signal ?? new AbortController().signal
    if (!externalSignal.aborted) {
      externalSignal.addEventListener(
        "abort",
        () =>
          controller.abort(
            externalSignal.reason ?? new DOMException("Request cancelled", "AbortError")
          ),
        { once: true }
      )
    }
    const timeoutId = scheduleTimeout(timeoutMs, controller)

    const startedAt = performance.now()
    let response: Response
    try {
      response = await fetch(url, {
        method,
        headers,
        body: method === "GET" || method === "HEAD" ? undefined : (body ?? undefined),
        signal: controller.signal,
        redirect: "follow",
      })
    } catch (error) {
      const mapped = mapFetchError(error)
      throw new ToolExecutionError("PROCESSING", mapped.message, [], mapped)
    } finally {
      clearTimeout(timeoutId)
    }
    const durationMs = performance.now() - startedAt

    // Response headers: only what the browser exposes under CORS. Forbidden
    // headers are unreadable through fetch — we stay honest about that.
    const responseHeaders: Array<{ name: string; value: string }> = []
    response.headers.forEach((value, name) => responseHeaders.push({ name, value }))

    const contentType = response.headers.get("content-type") ?? ""
    const { body: responseBody, truncated } = await readResponseBody(response)

    const lengthHeader = Number(response.headers.get("content-length"))
    const responseSizeBytes =
      Number.isFinite(lengthHeader) && lengthHeader >= 0
        ? lengthHeader
        : new TextEncoder().encode(responseBody).length

    return {
      url,
      method,
      status: response.status,
      statusText: response.statusText,
      durationMs,
      responseHeaders,
      responseBody,
      responseSizeBytes,
      contentType,
      truncated,
    }
  },
  summarize: {
    input: (value) => {
      // Safe metadata only: method + hostname + pathname. No query string
      // (it can carry secrets), no headers, no body, no credentials.
      return `${value.method} ${safeHostPath(value.url)}`
    },
    output: (value) => `${value.method} → ${value.status} (${Math.round(value.durationMs)}ms)`,
  },
})

function safeHostPath(rawUrl: string): string {
  try {
    const parsed = new URL(rawUrl)
    return `${parsed.hostname}${parsed.pathname}`
  } catch {
    return "(invalid url)"
  }
}

function scheduleTimeout(
  timeoutMs: number,
  controller: AbortController
): ReturnType<typeof setTimeout> | undefined {
  if (typeof setTimeout === "undefined") return undefined
  return setTimeout(() => {
    controller.abort(new DOMException("Request timed out", "TimeoutError"))
  }, timeoutMs)
}

async function readResponseBody(response: Response): Promise<{ body: string; truncated: boolean }> {
  const reader = response.body?.getReader()
  if (!reader) {
    const text = await response.text()
    return {
      body: text.length > RESPONSE_DISPLAY_CAP ? text.slice(0, RESPONSE_DISPLAY_CAP) : text,
      truncated: text.length > RESPONSE_DISPLAY_CAP,
    }
  }
  const chunks: Uint8Array[] = []
  let total = 0
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    if (value) {
      total += value.length
      if (total > RESPONSE_DISPLAY_CAP) {
        chunks.push(value.slice(0, RESPONSE_DISPLAY_CAP - (total - value.length)))
        return {
          body: new TextDecoder().decode(concatChunks(chunks)),
          truncated: true,
        }
      }
      chunks.push(value)
    }
  }
  return { body: new TextDecoder().decode(concatChunks(chunks)), truncated: false }
}

function concatChunks(chunks: Uint8Array[]): Uint8Array {
  const total = chunks.reduce((sum, chunk) => sum + chunk.length, 0)
  const out = new Uint8Array(total)
  let offset = 0
  for (const chunk of chunks) {
    out.set(chunk, offset)
    offset += chunk.length
  }
  return out
}

function asValidationError(error: unknown): ToolExecutionError {
  if (error instanceof HttpRequestError) {
    return new ToolExecutionError("VALIDATION", error.message)
  }
  if (error instanceof ToolExecutionError) return error
  return new ToolExecutionError("VALIDATION", "Please fix the request and try again.")
}
