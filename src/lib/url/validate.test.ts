import { describe, expect, it } from "vitest"
import {
  validateUrl,
  urlWithoutCredentials,
  hostOnly,
  robotsUrlFor,
  hasCredentials,
  TRACKING_PARAMETERS,
} from "./validate"

describe("validateUrl", () => {
  it("accepts a plain https URL", () => {
    const result = validateUrl("https://example.com/some/page?q=1#frag")
    expect(result.ok).toBe(true)
    expect(result.url?.hostname).toBe("example.com")
    expect(result.url?.pathname).toBe("/some/page")
  })

  it("accepts plain http", () => {
    const result = validateUrl("http://example.com")
    expect(result.ok).toBe(true)
  })

  it("assumes https when the scheme is omitted", () => {
    const result = validateUrl("example.com/path")
    expect(result.ok).toBe(true)
    expect(result.url?.protocol).toBe("https:")
  })

  it("rejects javascript: URLs", () => {
    const result = validateUrl("javascript:alert(1)")
    expect(result.ok).toBe(false)
    expect(result.reason).toContain("not supported")
  })

  it("rejects file: URLs", () => {
    expect(validateUrl("file:///etc/passwd").ok).toBe(false)
  })

  it("rejects data: URLs", () => {
    expect(validateUrl("data:text/html,<b>hi</b>").ok).toBe(false)
  })

  it("rejects ftp:", () => {
    expect(validateUrl("ftp://example.com/file").ok).toBe(false)
  })

  it("rejects blob: and chrome: protocols", () => {
    expect(validateUrl("blob:https://x/y").ok).toBe(false)
    expect(validateUrl("chrome://settings").ok).toBe(false)
  })

  it("rejects malformed URLs", () => {
    const result = validateUrl("https://exa mple.com/path with space")
    expect(result.ok).toBe(false)
    expect(result.reason).toContain("could not be parsed")
  })

  it("rejects empty input", () => {
    expect(validateUrl("   ").ok).toBe(false)
  })

  it("accepts URLs with ports, query strings and fragments", () => {
    const result = validateUrl("https://example.com:8443/path?b=2&a=1#section")
    expect(result.ok).toBe(true)
    expect(result.url?.port).toBe("8443")
    expect(result.url?.searchParams.get("b")).toBe("2")
    expect(result.url?.hash).toBe("#section")
  })

  it("rejects malformed hostnames with doubled dots", () => {
    expect(validateUrl("https://exa..mple.com").ok).toBe(false)
  })

  it("rejects inputs longer than 2048 characters", () => {
    expect(validateUrl(`https://example.com/${"a".repeat(2100)}`).ok).toBe(false)
  })
})

describe("credential handling", () => {
  it("strips username and password for display", () => {
    const url = new URL("https://user:secret@example.com/path")
    expect(urlWithoutCredentials(url)).toBe("https://example.com/path")
  })

  it("reports credential presence without exposing the password", () => {
    const url = new URL("https://user:secret@example.com")
    const creds = hasCredentials(url)
    expect(creds.username).toBe(true)
    expect(creds.password).toBe(true)
    expect(url.password).toBe("secret")
  })

  it("hostOnly never includes credentials or paths", () => {
    const url = new URL("https://user:secret@example.com:8443/a/b?q=1")
    expect(hostOnly(url)).toBe("example.com")
  })
})

describe("robotsUrlFor", () => {
  it("always builds origin + /robots.txt, ignoring user paths", () => {
    const url = new URL("https://example.com/some/deep/path?x=1")
    expect(robotsUrlFor(url).href).toBe("https://example.com/robots.txt")
  })

  it("keeps the port", () => {
    const url = new URL("http://localhost:3000/anything")
    expect(robotsUrlFor(url).href).toBe("http://localhost:3000/robots.txt")
  })
})

describe("TRACKING_PARAMETERS", () => {
  it("covers the documented set", () => {
    expect(TRACKING_PARAMETERS).toEqual([
      "utm_source",
      "utm_medium",
      "utm_campaign",
      "utm_term",
      "utm_content",
      "fbclid",
      "gclid",
    ])
  })
})
