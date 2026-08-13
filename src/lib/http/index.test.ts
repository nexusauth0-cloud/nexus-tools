import { describe, expect, it } from "vitest"
import {
  buildRequestBody,
  HTTP_MAX_BODY_CHARS,
  HTTP_MAX_HEADERS,
  HTTP_MAX_TIMEOUT_MS,
  HttpRequestError,
  isSensitiveHeader,
  isSupportedMethod,
  normalizeHeaderName,
  safeRequestMetadata,
  summarizeRequest,
  urlContainsSensitiveSegment,
  validateHeader,
  validateHeaders,
  validateJsonBody,
  validateRequestUrl,
  validateTimeout,
} from "./index"

describe("isSupportedMethod", () => {
  it("accepts the supported set and rejects others", () => {
    expect(isSupportedMethod("GET")).toBe(true)
    expect(isSupportedMethod("POST")).toBe(true)
    expect(isSupportedMethod("get")).toBe(false)
    expect(isSupportedMethod("TRACE")).toBe(false)
    expect(isSupportedMethod("")).toBe(false)
  })
})

describe("validateRequestUrl", () => {
  it("accepts http/https and normalizes", () => {
    expect(validateRequestUrl("https://api.example.com/v1/items?x=1")).toBe(
      "https://api.example.com/v1/items?x=1"
    )
    expect(validateRequestUrl("  http://example.com  ")).toBe("http://example.com/")
  })

  it("rejects empty, non-URL, and dangerous protocols", () => {
    expect(() => validateRequestUrl("")).toThrow(HttpRequestError)
    expect(() => validateRequestUrl("not a url")).toThrow(HttpRequestError)
    expect(() => validateRequestUrl("javascript:alert(1)")).toThrow(/not supported/)
    expect(() => validateRequestUrl("file:///etc/passwd")).toThrow(/not supported/)
    expect(() => validateRequestUrl("data:text/html,<b>hi</b>")).toThrow(/not supported/)
  })

  it("rejects overly long URLs with URL_TOO_LONG", () => {
    const long = `https://example.com/?q=${"a".repeat(9000)}`
    expect(() => validateRequestUrl(long)).toThrow(/too long/)
  })
})

describe("header validation", () => {
  it("normalizes names to lowercase", () => {
    expect(normalizeHeaderName("  Content-Type  ")).toBe("content-type")
  })

  it("accepts token-character names", () => {
    expect(() => validateHeader("X-Custom-Header", "value")).not.toThrow()
    expect(() => validateHeader("x-token_1.A~", "v")).not.toThrow()
  })

  it("rejects empty names, invalid chars, line breaks in values", () => {
    expect(() => validateHeader("", "v")).toThrow(HttpRequestError)
    expect(() => validateHeader("bad name", "v")).toThrow(/invalid characters/)
    expect(() => validateHeader("ok", "line\nbreak")).toThrow(/line break/)
    expect(() => validateHeader("ok", "line\r\nbreak")).toThrow(/line break/)
    expect(() => validateHeader("x".repeat(200), "v")).toThrow(/128/)
  })

  it("flags sensitive headers", () => {
    expect(isSensitiveHeader("Authorization")).toBe(true)
    expect(isSensitiveHeader("content-type")).toBe(false)
    expect(isSensitiveHeader("Cookie")).toBe(true)
  })

  it("enforces the header count cap", () => {
    const many = Array.from({ length: HTTP_MAX_HEADERS + 1 }, () => ({ name: "x", value: "1" }))
    expect(() => validateHeaders(many)).toThrow(/Too many headers/)
  })
})

describe("body and timeout validation", () => {
  it("parses JSON bodies and rejects invalid JSON", () => {
    expect(validateJsonBody('  {"a": [1, 2]}  ')).toEqual({ a: [1, 2] })
    expect(validateJsonBody("")).toBeUndefined()
    expect(() => validateJsonBody("{not json")).toThrow(HttpRequestError)
  })

  it("enforces the body size cap and kind none", () => {
    expect(buildRequestBody("none", "ignored big body")).toBeNull()
    expect(buildRequestBody("text", "hello")).toBe("hello")
    expect(() => buildRequestBody("json", "x".repeat(HTTP_MAX_BODY_CHARS + 1))).toThrow(/too large/)
  })

  it("validates timeout bounds and rounds", () => {
    expect(validateTimeout(12_345.6)).toBe(12_346)
    expect(() => validateTimeout(100)).toThrow(/500/)
    expect(() => validateTimeout(HTTP_MAX_TIMEOUT_MS + 1)).toThrow(/too large/)
    expect(() => validateTimeout(Number.NaN)).toThrow(/500/)
  })
})

describe("safe metadata / history summaries", () => {
  it("strips query strings and sensitive segments", () => {
    const meta = safeRequestMetadata(
      "POST",
      "https://user:pa%24%24@example.com/api/items?token=abc",
      42
    )
    expect(meta.hostname).toBe("example.com")
    expect(meta.pathname).toBe("/api/items")
    expect(meta.requestSizeBytes).toBe(42)

    const url = "https://example.com/admin/settings?key=secret"
    expect(urlContainsSensitiveSegment(url)).toBe(true)
    expect(urlContainsSensitiveSegment("https://example.com/public/page")).toBe(false)
  })

  it("summarizes with status and duration", () => {
    const meta: Parameters<typeof summarizeRequest>[0] = {
      method: "GET",
      hostname: "example.com",
      pathname: "/v1/items",
      timestamp: 1,
      status: 201,
      durationMs: 412.4,
      requestSizeBytes: 0,
    }
    expect(summarizeRequest(meta)).toBe("GET example.com/v1/items → 201 (412ms)")
    expect(summarizeRequest({ ...meta, status: undefined, durationMs: undefined })).toBe(
      "GET example.com/v1/items"
    )
  })

  it("falls back to a placeholder host for unparseable URLs", () => {
    const meta = safeRequestMetadata("GET", "::not a url::", 0)
    expect(meta.hostname).toBeTruthy()
  })
})
