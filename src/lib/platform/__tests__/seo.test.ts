import { describe, expect, it } from "vitest"
import { buildToolJsonLd, buildToolBreadcrumbJsonLd } from "../seo"
import { makeTool } from "./fixtures"

type JsonLd = Record<string, unknown>

describe("SEO JSON-LD", () => {
  it("builds SoftwareApplication JSON-LD with a free offer", () => {
    const jsonLd = buildToolJsonLd(makeTool({ slug: "json-formatter", tier: "free" })) as JsonLd
    expect(jsonLd["@type"]).toBe("SoftwareApplication")
    expect((jsonLd.offers as { price: string }).price).toBe("0")
  })

  it("builds a BreadcrumbList JSON-LD document", () => {
    const jsonLd = buildToolBreadcrumbJsonLd(makeTool({ slug: "image-compressor" })) as JsonLd
    expect(jsonLd["@type"]).toBe("BreadcrumbList")
    const elements = jsonLd.itemListElement as { position: number }[]
    expect(elements).toHaveLength(3)
    expect(elements[0].position).toBe(1)
  })
})
