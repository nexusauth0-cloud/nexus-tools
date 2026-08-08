import { describe, expect, it } from "vitest"
import {
  EXPORT_FORMATS,
  availableExports,
  extensionFor,
  formatExport,
  labelFor,
  mimeFor,
} from "../export"

describe("export registry", () => {
  it("registers the five built-in formats", () => {
    expect(EXPORT_FORMATS).toEqual(["txt", "json", "csv", "html", "md"])
    expect(availableExports().map((e) => e.format)).toEqual(EXPORT_FORMATS)
  })

  it("maps extensions and mime types", () => {
    expect(extensionFor("json")).toBe("json")
    expect(mimeFor("csv")).toBe("text/csv")
    expect(labelFor("md")).toBe("Markdown")
    expect(extensionFor("unknown")).toBe("unknown")
    expect(mimeFor("unknown")).toBe("text/plain")
  })

  it("throws when formatting an unregistered format", () => {
    expect(() => formatExport("nope" as never, "x")).toThrow(/No exporter registered/)
  })
})

describe("formatExport", () => {
  const sample = { name: "nexus", items: [1, 2] }

  it("compiles plain text", () => {
    expect(formatExport("txt", sample).content).toContain('"name": "nexus"')
  })

  it("compiles pretty JSON by default and compact on demand", () => {
    const pretty = formatExport("json", sample)
    expect(pretty.content).toContain("\n  ")
    const compact = formatExport("json", sample, { pretty: false })
    expect(compact.content).toBe(JSON.stringify(sample))
  })

  it("compiles CSV with headers and quoted cells", () => {
    const rows = [
      { a: 'say "hi"', b: 1 },
      { a: "line\nbreak", b: 2 },
    ]
    const csv = formatExport("csv", rows).content
    expect(csv.split("\n")[0]).toBe("a,b")
    expect(csv).toContain('"say ""hi"""')
    expect(csv).toContain('"line\nbreak"')
  })

  it("compiles HTML with escaped content", () => {
    const html = formatExport("html", "<script>alert(1)</script>").content
    expect(html).toContain("&lt;script&gt;")
    expect(html).not.toContain("<script>")
  })

  it("compiles markdown with a language fence", () => {
    const md = formatExport("md", '{"a":1}', { language: "json" }).content
    expect(md).toContain("```json")
    expect(md.endsWith("```\n")).toBe(true)
  })

  it("passes through string values for text formats", () => {
    expect(formatExport("txt", "hello world").content).toBe("hello world")
  })
})
