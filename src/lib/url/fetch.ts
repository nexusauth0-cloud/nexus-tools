/**
 * Browser-native, bounded HTTP fetch for the webmaster tools.
 *
 * Everything here runs client-side with fetch + AbortController
 * (injected for tests). Failures are classified into a small set of
 * user-safe kinds instead of leaking browser internals, and CORS
 * failures are reported honestly — never proxied or fabricated.
 *
 * Redirects are whatever the browser's fetch does natively
 * (`redirect: "follow"`); the final URL is the one the browser exposes,
 * and that is all we claim to know about redirects.
 */

import { ToolExecutionError } from "@/lib/tool-engine"
import { CORS_UNREACHABLE_MESSAGE } from "./constants"

export type NetworkFailureKind = "invalid-url" | "timeout" | "unreachable" | "too-large" | "aborted"

export class NetworkFetchError extends Error {
  readonly kind: NetworkFailureKind
  constructor(kind: NetworkFailureKind, message: string) {
    super(message)
    this.name = "NetworkFetchError"
    this.kind = kind
  }
}

export interface FetchResourceInput {
  url: string
  /** Abort after this many milliseconds (user-facing timeout). */
  timeoutMs: number
  /** Read at most this many bytes of the body. */
  maxBytes: number
  /** Optional: reject early when Content-Length already exceeds maxBytes. */
  signal?: AbortSignal
}

export interface FetchedResource {
  status: number
  /** The final URL after the browser's native redirect handling. */
  finalUrl: string
  /** Raw Content-Type header (may be absent). */
  contentType: string | null
  /** Mime portion of Content-Type, lower-cased ("" when absent). */
  mime: string
  /** Bytes actually read (≤ maxBytes). */
  bytes: Uint8Array
  /** When true, reading stopped early because the resource exceeds maxBytes. */
  truncated: boolean
}

export interface FetchHeadersResult {
  status: number
  statusText: string | null
  finalUrl: string
  contentType: string | null
  /** Headers the browser actually exposed (always a subset of what the server sent). */
  headers: Record<string, string>
}

type Fetcher = (input: string, init: RequestInit) => Promise<Response>

let fetcher: Fetcher = (input, init) => globalThis.fetch(input, init)

/** Dependency-injection seam for tests; the default is the platform fetch. */
export function setNetworkFetcher(impl: Fetcher): void {
  fetcher = impl
}

export function getNetworkFetcher(): Fetcher {
  return fetcher
}

export function restoreDefaultNetworkFetcher(): void {
  fetcher = (input, init) => globalThis.fetch(input, init)
}

/** Mime types that are definitively not text and not worth decoding. */
const BINARY_MIME = /^(image|audio|video)\/|application\/(pdf|zip|gzip|octet-stream)/

export function isBinaryMime(mime: string): boolean {
  return BINARY_MIME.test(mime)
}

/** Lower-cased mime portion of a Content-Type header, without params. */
export function mimeOf(contentType: string | null): string {
  if (!contentType) return ""
  return contentType.split(";")[0].trim().toLowerCase()
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError"
}

/** True when the platform cannot reach the target (CORS block, DNS, TCP…). */
function isNetworkTypeError(error: unknown): boolean {
  return error instanceof TypeError
}

/**
 * Fetches a body with a hard timeout and hard byte cap. On CORS/network
 * failure throws a classified error; an oversized response throws
 * `too-large` before its full body is ever buffered.
 */
export async function fetchResource(input: FetchResourceInput): Promise<FetchedResource> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), input.timeoutMs)
  if (input.signal) {
    const stop = () => controller.abort()
    if (input.signal.aborted) controller.abort()
    else input.signal.addEventListener("abort", stop, { once: true })
  }

  try {
    const response = await fetcher(input.url, { redirect: "follow", signal: controller.signal })

    const contentLength = Number(response.headers.get("content-length") ?? "")
    const contentType = response.headers.get("content-type")
    const finalUrl = response.url || input.url

    if (Number.isFinite(contentLength) && contentLength > input.maxBytes) {
      throw new NetworkFetchError(
        "too-large",
        `This resource is larger than the ${Math.round(input.maxBytes / (1024 * 1024))} MB analysis limit.`
      )
    }

    if (!response.body) {
      // No streaming support — bounded by the timeout only.
      const buffer = new Uint8Array(await response.arrayBuffer())
      const truncated = buffer.length > input.maxBytes
      return {
        status: response.status,
        finalUrl,
        contentType,
        mime: mimeOf(contentType),
        bytes: truncated ? buffer.slice(0, input.maxBytes) : buffer,
        truncated,
      }
    }

    const reader = response.body.getReader()
    const chunks: Uint8Array[] = []
    let total = 0
    let truncated = false
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      if (total + value.length > input.maxBytes) {
        truncated = true
        chunks.push(value.slice(0, input.maxBytes - total))
        total = input.maxBytes
        break
      }
      chunks.push(value)
      total += value.length
    }
    if (truncated) await reader.cancel().catch(() => undefined)

    const out = new Uint8Array(total)
    let offset = 0
    for (const chunk of chunks) {
      out.set(chunk, offset)
      offset += chunk.length
    }

    return {
      status: response.status,
      finalUrl,
      contentType,
      mime: mimeOf(contentType),
      bytes: out,
      truncated,
    }
  } catch (error) {
    if (isAbortError(error)) {
      throw new NetworkFetchError(
        "timeout",
        `The request timed out after ${Math.round(input.timeoutMs / 1000)} seconds.`
      )
    }
    if (error instanceof NetworkFetchError) throw error
    if (isNetworkTypeError(error)) {
      throw new NetworkFetchError("unreachable", CORS_UNREACHABLE_MESSAGE)
    }
    throw new NetworkFetchError("unreachable", CORS_UNREACHABLE_MESSAGE)
  } finally {
    clearTimeout(timeout)
  }
}

/**
 * Fetches response headers only — the body stream is cancelled as soon
 * as headers arrive, so nothing is downloaded. Only headers the browser
 * actually exposes are returned.
 */
export async function fetchHeadersOnly(input: FetchResourceInput): Promise<FetchHeadersResult> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), input.timeoutMs)

  try {
    const response = await fetcher(input.url, {
      redirect: "follow",
      method: "GET",
      signal: controller.signal,
    })
    const headers: Record<string, string> = {}
    response.headers.forEach((value, name) => {
      headers[name.toLowerCase()] = value
    })
    void response.body?.cancel().catch(() => undefined)
    return {
      status: response.status,
      statusText: response.statusText || null,
      finalUrl: response.url || input.url,
      contentType: response.headers.get("content-type"),
      headers,
    }
  } catch (error) {
    if (isAbortError(error)) {
      throw new NetworkFetchError(
        "timeout",
        `The request timed out after ${Math.round(input.timeoutMs / 1000)} seconds.`
      )
    }
    throw new NetworkFetchError("unreachable", CORS_UNREACHABLE_MESSAGE)
  } finally {
    clearTimeout(timeout)
  }
}

/** Map a fetched-resource problem into a tool-surface error with a safe message. */
export function toNetworkToolError(error: unknown): ToolExecutionError {
  if (error instanceof NetworkFetchError) {
    return new ToolExecutionError("NOT_SUPPORTED", error.message)
  }
  return new ToolExecutionError("NOT_SUPPORTED", CORS_UNREACHABLE_MESSAGE, [], error)
}

/** Decode fetched bytes as UTF-8 text (never throws). */
export function decodeUtf8(bytes: Uint8Array): string {
  return new TextDecoder("utf-8").decode(bytes)
}
