import { beforeEach, describe, expect, it } from "vitest"
import { useFavoritesStore } from "./favorites-store"

describe("favorites store", () => {
  beforeEach(() => {
    useFavoritesStore.setState({ favorites: [] })
  })

  it("toggles a tool on and off", () => {
    const { toggleFavorite, isFavorite } = useFavoritesStore.getState()
    expect(isFavorite("json-formatter")).toBe(false)

    toggleFavorite("json-formatter")
    expect(useFavoritesStore.getState().isFavorite("json-formatter")).toBe(true)

    toggleFavorite("json-formatter")
    expect(useFavoritesStore.getState().isFavorite("json-formatter")).toBe(false)
  })

  it("adds multiple favorites", () => {
    const { toggleFavorite } = useFavoritesStore.getState()
    toggleFavorite("json-formatter")
    toggleFavorite("uuid-generator")
    toggleFavorite("hash-generator")

    expect(useFavoritesStore.getState().favorites).toEqual([
      "json-formatter",
      "uuid-generator",
      "hash-generator",
    ])
  })

  it("clears all favorites", () => {
    useFavoritesStore.getState().toggleFavorite("a")
    useFavoritesStore.getState().toggleFavorite("b")
    useFavoritesStore.getState().clear()
    expect(useFavoritesStore.getState().favorites).toEqual([])
  })

  it("does not duplicate a favorited tool", () => {
    useFavoritesStore.getState().toggleFavorite("a")
    useFavoritesStore.getState().toggleFavorite("b")
    useFavoritesStore.getState().toggleFavorite("a")
    expect(useFavoritesStore.getState().favorites).toEqual(["b"])
  })

  it("preserves order when toggling off a middle item", () => {
    const { toggleFavorite } = useFavoritesStore.getState()
    toggleFavorite("a")
    toggleFavorite("b")
    toggleFavorite("c")
    toggleFavorite("b")
    expect(useFavoritesStore.getState().favorites).toEqual(["a", "c"])
  })
})
