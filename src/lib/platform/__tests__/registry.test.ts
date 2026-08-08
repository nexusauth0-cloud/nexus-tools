import { describe, expect, it } from "vitest"
import { createToolRegistry } from "../registry"
import { fixtureTools } from "./fixtures"

describe("createToolRegistry", () => {
  const registry = createToolRegistry(fixtureTools)

  it("exposes every manifest", () => {
    expect(registry.all).toHaveLength(fixtureTools.length)
    expect(registry.getBySlug("json-formatter")?.title).toBe("Json Formatter")
    expect(registry.getBySlug("missing")).toBeUndefined()
  })

  it("sorts featured tools by popularity", () => {
    const usage = registry.featured.map((tool) => tool.usage)
    expect(usage).toEqual([...usage].sort((a, b) => b - a))
    expect(registry.featured.every((tool) => tool.featured)).toBe(true)
  })

  it("includes tools flagged popular or above the usage threshold", () => {
    const slugs = registry.popular.map((tool) => tool.slug)
    expect(slugs).toContain("json-formatter")
    expect(slugs).toContain("image-compressor")
    expect(slugs).not.toContain("svg-optimizer")
  })

  it("returns newest tools sorted by updatedAt descending", () => {
    expect(registry.new.map((tool) => tool.slug)).toEqual(["password-generator", "svg-optimizer"])
  })

  it("filters premium tools", () => {
    const slugs = registry.premium.map((tool) => tool.slug)
    expect(slugs).toEqual(["base64-encoder", "text-summarizer"])
  })

  it("groups tools by category", () => {
    const developerSlugs = registry.byCategory("developer").map((tool) => tool.slug)
    expect(developerSlugs).toEqual(["json-formatter", "base64-encoder", "svg-optimizer"])
    expect(registry.byCategory("unknown")).toEqual([])
    expect(registry.categoryIds).toEqual(
      expect.arrayContaining(["developer", "image", "security", "ai"])
    )
  })
})
