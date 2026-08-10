import { afterEach, describe, expect, it } from "vitest"
import {
  setNetworkFetcher,
  restoreDefaultNetworkFetcher,
  fetchResource,
  fetchHeadersOnly,
  NetworkFetchError,
  mimeOf,
  isBinaryMime,
} from "./fetch"

function responseFrom(init: {
  status?: number
  headers?: Record<string, string>
  body?: string | Uint8Array | null
  url?: string
  statusText?: string
}): Response {
  const body: BodyInit | null = init.body === null ? null : ((init.body ?? "") as BodyInit)
  const headers = new Headers(init.headers)
  if (!headers.has("content-type")) headers.set("content-type", "text/plain")
  const response = new Response(body, {
    status: init.status ?? 200,
    statusText: init.statusText,
    headers,
  })
  if (init.url) Object.defineProperty(response, "url", { value: init.url })
  return response
}

afterEach(() => {
  restoreDefaultNetworkFetcher()
})

describe("fetchResource", () => {
  it("returns status, final URL, content type and bytes", async () => {
    setNetworkFetcher(async () =>
      responseFrom({
        status: 200,
        url: "https://example.com/redirected",
        headers: { "content-type": "text/html; charset=utf-8" },
        body: "<html></html>",
      })
    )
    const result = await fetchResource({
      url: "https://example.com/start",
      timeoutMs: 1000,
      maxBytes: 1024,
    })
    expect(result.status).toBe(200)
    expect(result.finalUrl).toBe("https://example.com/redirected")
    expect(result.mime).toBe("text/html")
    expect(new TextDecoder().decode(result.bytes)).toBe("<html></html>")
    expect(result.truncated).toBe(false)
  })

  it("aborts oversized bodies and reports them (before full download)", async () => {
    setNetworkFetcher(async () =>
      responseFrom({
        body: "x".repeat(10_000),
        headers: { "content-type": "text/plain" },
      })
    )
    const result = await fetchResource({
      url: "https://example.com/large",
      timeoutMs: 1000,
      maxBytes: 1000,
    })
    expect(result.truncated).toBe(true)
    expect(result.bytes.length).toBe(1000)
  })

  it("rejects by Content-Length without reading the body", async () => {
    setNetworkFetcher(async () =>
      responseFrom({
        headers: { "content-length": "5000", "content-type": "text/plain" },
        body: "y".repeat(5000),
      })
    )
    await expect(
      fetchResource({ url: "https://example.com/big", timeoutMs: 1000, maxBytes: 100 })
    ).rejects.toMatchObject({ kind: "too-large" })
  })

  it("classifies timeouts distinctly", async () => {
    setNetworkFetcher(
      (_input, init) =>
        new Promise<Response>((_resolve, reject) => {
          init.signal?.addEventListener("abort", () =>
            reject(new DOMException("aborted", "AbortError"))
          )
        })
    )
    await expect(
      fetchResource({ url: "https://example.com/slow", timeoutMs: 40, maxBytes: 100 })
    ).rejects.toMatchObject({ kind: "timeout" })
  })

  it("classifies CORS/network failures as unreachable", async () => {
    setNetworkFetcher(async () => {
      throw new TypeError("Failed to fetch")
    })
    await expect(
      fetchResource({ url: "https://blocked.example", timeoutMs: 1000, maxBytes: 100 })
    ).rejects.toMatchObject({ kind: "unreachable" })
    await expect(
      fetchResource({ url: "https://blocked.example", timeoutMs: 1000, maxBytes: 100 })
    ).rejects.toThrow(/does not allow browser-based cross-origin/)
  })

  it("classifies generic failures as unreachable too", async () => {
    setNetworkFetcher(async () => {
      throw new Error("boom")
    })
    await expect(
      fetchResource({ url: "https://example.com", timeoutMs: 1000, maxBytes: 100 })
    ).rejects.toMatchObject({ kind: "unreachable" })
  })

  it("reports HTTP error statuses without throwing (caller decides)", async () => {
    setNetworkFetcher(async () =>
      responseFrom({ status: 404, body: "gone", headers: { "content-type": "text/plain" } })
    )
    const result = await fetchResource({
      url: "https://example.com/missing",
      timeoutMs: 1000,
      maxBytes: 100,
    })
    expect(result.status).toBe(404)
  })

  it("exposes abort through an external signal", async () => {
    const controller = new AbortController()
    let settled = false
    setNetworkFetcher(async (input, init) => {
      void input
      return new Promise<Response>((_resolve, reject) => {
        init.signal?.addEventListener("abort", () => {
          settled = true
          reject(new DOMException("aborted", "AbortError"))
        })
      })
    })
    setTimeout(() => controller.abort(), 10)
    await expect(
      fetchResource({
        url: "https://example.com/abort",
        timeoutMs: 5000,
        maxBytes: 100,
        signal: controller.signal,
      })
    ).rejects.toMatchObject({ kind: "timeout" })
    expect(settled).toBe(true)
  })
})

describe("fetchHeadersOnly", () => {
  it("returns only exposed headers and cancels the body", async () => {
    let bodyCancelled = false
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new TextEncoder().encode("content"))
      },
      cancel() {
        bodyCancelled = true
      },
    })
    setNetworkFetcher(
      async () =>
        new Response(stream, {
          status: 200,
          statusText: "OK",
          headers: { "content-type": "text/html", "x-custom": "1", "cache-control": "no-store" },
        })
    )
    const result = await fetchHeadersOnly({
      url: "https://example.com/headers",
      timeoutMs: 1000,
      maxBytes: 1,
    })
    expect(result.status).toBe(200)
    expect(result.statusText).toBe("OK")
    expect(result.headers["x-custom"]).toBe("1")
    expect(result.headers["cache-control"]).toBe("no-store")
    expect(bodyCancelled).toBe(true)
  })

  it("classifies failures the same way", async () => {
    setNetworkFetcher(async () => {
      throw new TypeError("Failed to fetch")
    })
    await expect(
      fetchHeadersOnly({ url: "https://blocked.example", timeoutMs: 1000, maxBytes: 1 })
    ).rejects.toBeInstanceOf(NetworkFetchError)
  })
})

describe("mime helpers", () => {
  it("parses the mime part without parameters", () => {
    expect(mimeOf("text/html; charset=utf-8")).toBe("text/html")
    expect(mimeOf(null)).toBe("")
    expect(mimeOf("APPLICATION/XML")).toBe("application/xml")
  })

  it("flags binary mime types", () => {
    expect(isBinaryMime("image/png")).toBe(true)
    expect(isBinaryMime("application/pdf")).toBe(true)
    expect(isBinaryMime("audio/mpeg")).toBe(true)
    expect(isBinaryMime("text/html")).toBe(false)
    expect(isBinaryMime("application/xml")).toBe(false)
  })
})
