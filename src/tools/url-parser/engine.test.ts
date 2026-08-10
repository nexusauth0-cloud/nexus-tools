import { describe, expect, it } from "vitest"
import { rebuildUrlWithoutTracking, urlParserEngine } from "./engine"

describe("urlParserEngine", () => {
  it("splits a URL into its components with sanitized output", async () => {
    const result = await urlParserEngine.run({
      url: "https://user:secret@example.com:8443/path/to?a=1&a=2&empty=&utm_source=newsletter#section",
    })
    const output = result.output
    expect(output.url).toBe(
      "https://example.com:8443/path/to?a=1&a=2&empty=&utm_source=newsletter#section"
    )
    expect(output.protocol).toBe("https:")
    expect(output.usernamePresent).toBe(true)
    expect(output.passwordPresent).toBe(true)
    expect(output.hostname).toBe("example.com")
    expect(output.port).toBe("8443")
    expect(output.pathname).toBe("/path/to")
    expect(output.hash).toBe("#section")
    expect(output.origin).toBe("https://example.com:8443")
    expect(output.url).not.toContain("secret")
  })

  it("keeps duplicate keys distinct with occurrence order and flags them", async () => {
    const result = await urlParserEngine.run({
      url: "https://example.com/?tag=red&tag=blue&tag=green",
    })
    const output = result.output
    expect(output.params).toEqual([
      { key: "tag", value: "red", occurrence: 0 },
      { key: "tag", value: "blue", occurrence: 1 },
      { key: "tag", value: "green", occurrence: 2 },
    ])
    expect(output.duplicateKeys).toEqual(["tag"])
  })

  it("counts empty parameter values", async () => {
    const result = await urlParserEngine.run({ url: "https://example.com/?a=&b=1" })
    expect(result.output.emptyValueCount).toBe(1)
  })

  it("lists tracking parameters but never removes them silently", async () => {
    const result = await urlParserEngine.run({
      url: "https://example.com/?utm_source=news&fbclid=abc&keep=1",
    })
    expect(result.output.trackingParams).toEqual(["utm_source", "fbclid"])
    expect(result.output.url).toContain("utm_source=news")
    expect(result.output.trackingNotice).toContain("never removed automatically")
  })

  it("assumes https for scheme-less input", async () => {
    const result = await urlParserEngine.run({ url: "example.com/a?b=2" })
    expect(result.output.protocol).toBe("https:")
    expect(result.output.hostname).toBe("example.com")
  })

  it("rejects unsupported schemes and malformed URLs", async () => {
    await expect(urlParserEngine.run({ url: "ftp://files.example" })).rejects.toThrow(
      /Protocol "ftp:" is not supported/
    )
    await expect(urlParserEngine.run({ url: "https://exa mple.com/path" })).rejects.toThrow(
      /could not be parsed/
    )
  })

  it("rejects empty input", async () => {
    await expect(urlParserEngine.run({ url: "   " })).rejects.toThrow(/Enter a URL first/)
  })
})

describe("rebuildUrlWithoutTracking", () => {
  it("removes tracking parameters and reports them, keeping everything else", () => {
    const { url, removed } = rebuildUrlWithoutTracking(
      "https://user:pass@example.com/p?utm_source=x&utm_medium=y&keep=1&gclid=z",
      ["utm_source", "utm_medium", "gclid"]
    )
    expect(removed).toEqual(["utm_source", "utm_medium", "gclid"])
    expect(url).toBe("https://example.com/p?keep=1")
  })

  it("matches tracking keys case-insensitively", () => {
    const { url, removed } = rebuildUrlWithoutTracking("https://example.com/?UTM_SOURCE=x", [
      "utm_source",
    ])
    expect(removed).toEqual(["UTM_SOURCE"])
    expect(url).toBe("https://example.com/")
  })
})
