import { describe, expect, it } from "vitest"
import { buildToolCategories, getCategoryToolCount } from "../categories"
import { fixtureTools } from "./fixtures"

describe("buildToolCategories", () => {
  const categories = buildToolCategories(fixtureTools)

  it("computes counts straight from manifests", () => {
    const developer = categories.find((c) => c.id === "developer")
    expect(developer?.toolCount).toBe(3)
    expect(getCategoryToolCount("ai", fixtureTools)).toBe(1)
  })

  it("keeps every editorial category browsable, including empty ones", () => {
    const ids = categories.map((c) => c.id)
    expect(ids).toEqual(expect.arrayContaining(["developer", "image", "security", "ai"]))
    const social = categories.find((c) => c.id === "social")
    expect(social?.toolCount).toBe(0)
    expect(social).toBeDefined()
  })

  it("orders categories by editorial sortOrder", () => {
    const ids = categories.map((c) => c.id)
    const sortedIds = [...ids].sort((a, b) => orderOf(a) - orderOf(b))
    expect(ids).toEqual(sortedIds)
  })

  it("merges editorial metadata (icon, gradient, name)", () => {
    const developer = categories.find((c) => c.id === "developer")
    expect(developer?.icon).toBeTypeOf("string")
    expect(developer?.name).toBe("Developer Tools")
    expect(developer?.gradient).toContain("violet")
  })

  it("formats tool counts", () => {
    expect(categories.find((c) => c.id === "developer")?.toolCount).toBe(3)
  })
})

function orderOf(id: string): number {
  const map: Record<string, number> = {
    image: 1,
    text: 2,
    developer: 3,
    converters: 4,
    security: 5,
    productivity: 6,
    seo: 7,
    ai: 8,
    finance: 9,
    video: 10,
    audio: 11,
    social: 12,
  }
  return map[id] ?? 999
}
