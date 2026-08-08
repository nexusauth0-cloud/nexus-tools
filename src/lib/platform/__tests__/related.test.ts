import { describe, expect, it } from "vitest"
import { computeRelatedTools } from "../related"
import { fixtureTools, makeTool } from "./fixtures"

describe("computeRelatedTools", () => {
  it("excludes the source tool", () => {
    const related = computeRelatedTools(fixtureTools, "json-formatter")
    expect(related.some((tool) => tool.slug === "json-formatter")).toBe(false)
  })

  it("prefers tools sharing a category", () => {
    const related = computeRelatedTools(fixtureTools, "json-formatter")
    expect(related.find((tool) => tool.slug === "base64-encoder") !== undefined).toBe(true)
    expect(related[0]?.categoryId).toBe("developer")
  })

  it("honors explicit related slugs first", () => {
    const tools = [...fixtureTools, makeTool({ slug: "target", related: ["svg-optimizer"] })]
    const related = computeRelatedTools(tools, "target", { limit: 2 })
    expect(related[0]?.slug).toBe("svg-optimizer")
  })

  it("respects the limit (default 3, a cap not a guarantee)", () => {
    const related = computeRelatedTools(fixtureTools, "json-formatter")
    expect(related.length).toBeLessThanOrEqual(3)
    expect(computeRelatedTools(fixtureTools, "json-formatter", { limit: 1 })).toHaveLength(1)
    expect(computeRelatedTools(fixtureTools, "json-formatter", { limit: 0 })).toHaveLength(0)
  })

  it("breaks ties by usage", () => {
    const related = computeRelatedTools(fixtureTools, "json-formatter")
    const usage = related.map((tool) => tool.usage)
    for (let i = 1; i < usage.length; i++) {
      expect(usage[i - 1]).toBeGreaterThanOrEqual(usage[i])
    }
  })
})
