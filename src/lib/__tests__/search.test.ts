import { beforeEach, describe, expect, it } from "vitest"
import { searchItems } from "../search"
import { useRecentsStore } from "@/store/recents-store"
import { useFavoritesStore } from "@/store/favorites-store"

beforeEach(() => {
  useRecentsStore.setState({ recents: [] })
  useFavoritesStore.setState({ favorites: [] })
})

describe("searchItems", () => {
  it("returns the first 8 items when query is empty", () => {
    const results = searchItems("")
    expect(results.length).toBeLessThanOrEqual(8)
    expect(results.length).toBeGreaterThan(0)
  })

  it("matches tools by title", () => {
    const results = searchItems("json")
    expect(results.some((item) => item.title.toLowerCase().includes("json"))).toBe(true)
  })

  it("matches tools by keywords", () => {
    const results = searchItems("base64")
    expect(results.some((item) => item.title.toLowerCase().includes("base64"))).toBe(true)
  })

  it("returns empty array for gibberish", () => {
    const results = searchItems("zxqwnotathing")
    expect(results).toEqual([])
  })

  it("returns results with correct shape", () => {
    const results = searchItems("json")
    for (const item of results) {
      expect(item).toHaveProperty("id")
      expect(item).toHaveProperty("type")
      expect(item).toHaveProperty("title")
      expect(item).toHaveProperty("description")
      expect(item).toHaveProperty("href")
      expect(item).toHaveProperty("icon")
      expect(item).toHaveProperty("keywords")
    }
  })
})
