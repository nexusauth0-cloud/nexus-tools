import { describe, expect, it } from "vitest"
import { createSearchEngine } from "../search"
import { fixtureTools } from "./fixtures"

describe("createSearchEngine", () => {
  const engine = createSearchEngine(fixtureTools)

  it("matches title and keyword tokens across fields", () => {
    const results = engine.search({ query: "json" })
    expect(results.map((r) => r.tool.slug)).toContain("json-formatter")
  })

  it("integrates multi-token queries", () => {
    const results = engine.search({ query: "compress image" })
    expect(results.map((r) => r.tool.slug)).toContain("image-compressor")
  })

  it("corrects short typos via fuzzy matching", () => {
    const results = engine.search({ query: "json-formatr" })
    expect(results.map((r) => r.tool.slug)).toContain("json-formatter")
  })

  it("returns empty results for gibberish", () => {
    expect(engine.search({ query: "zxqwnotathing" })).toEqual([])
  })

  it("filters by category", () => {
    const results = engine.search({ query: "", categoryId: "developer" })
    expect(results.length).toBeGreaterThan(0)
    expect(results.every((r) => r.tool.categoryId === "developer")).toBe(true)
  })

  it("filters to premium tools only", () => {
    const results = engine.search({ query: "", premiumOnly: true })
    expect(results.length).toBeGreaterThan(0)
    expect(results.every((r) => r.tool.tier !== "free")).toBe(true)
  })

  it("filters to featured tools only", () => {
    const results = engine.search({ query: "", featuredOnly: true })
    expect(results.length).toBeGreaterThan(0)
    expect(results.every((r) => r.tool.featured)).toBe(true)
  })

  it("sorts by popularity", () => {
    const results = engine.search({ query: "", sort: "popularity" })
    expect(results.map((r) => r.tool.usage)).toEqual(
      [...results.map((r) => r.tool.usage)].sort((a, b) => b - a)
    )
  })

  it("sorts by rating", () => {
    const results = engine.search({ query: "", sort: "rating" })
    const ratings = results.map((r) => r.tool.rating)
    for (let i = 1; i < ratings.length; i++) {
      expect(ratings[i - 1]).toBeGreaterThanOrEqual(ratings[i])
    }
  })

  it("sorts newest first", () => {
    const results = engine.search({ query: "", sort: "newest" })
    expect(results[0]?.tool.slug).toBe("password-generator")
  })
})
