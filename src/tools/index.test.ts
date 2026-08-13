import { describe, expect, it } from "vitest"
import { registeredToolComponents, registeredToolManifests } from "./index"

describe("tool registry", () => {
  it("registers every manifest with a component under its slug", () => {
    const slugs = registeredToolManifests.map((tool) => tool.slug).sort()
    const componentKeys = Object.keys(registeredToolComponents).sort()
    expect(componentKeys).toEqual(slugs)
  })

  it("registers unique slugs", () => {
    const slugs = registeredToolManifests.map((tool) => tool.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
  })

  it("registers every component as a renderable component", () => {
    for (const component of Object.values(registeredToolComponents)) {
      const renderable =
        typeof component === "function" || (typeof component === "object" && component !== null)
      expect(renderable).toBe(true)
    }
  })

  it("keeps manifest metadata static (no component payloads in manifests)", () => {
    for (const tool of registeredToolManifests) {
      expect(typeof tool.title).toBe("string")
      expect(typeof tool.shortDescription).toBe("string")
      expect(tool.slug.length).toBeGreaterThan(0)
    }
  })
})
