import { beforeEach, describe, expect, it } from "vitest"
import { useRecentsStore } from "@/store/recents-store"
import { useFavoritesStore } from "@/store/favorites-store"

describe("personalized section store interactions", () => {
  beforeEach(() => {
    useRecentsStore.setState({ recents: [] })
    useFavoritesStore.setState({ favorites: [] })
  })

  it("recents are newest-first", () => {
    const { push } = useRecentsStore.getState()
    push("json-formatter")
    push("uuid-generator")
    push("hash-generator")

    const slugs = useRecentsStore.getState().recents.map((e) => e.slug)
    expect(slugs).toEqual(["hash-generator", "uuid-generator", "json-formatter"])
  })

  it("recents cap at 8", () => {
    for (let i = 0; i < 12; i++) {
      useRecentsStore.getState().push(`tool-${i}`)
    }
    expect(useRecentsStore.getState().recents).toHaveLength(8)
  })

  it("favorites persist after toggle", () => {
    const { toggleFavorite } = useFavoritesStore.getState()
    toggleFavorite("json-formatter")
    toggleFavorite("uuid-generator")

    expect(useFavoritesStore.getState().favorites).toHaveLength(2)
    expect(useFavoritesStore.getState().isFavorite("json-formatter")).toBe(true)
    expect(useFavoritesStore.getState().isFavorite("uuid-generator")).toBe(true)
  })

  it("favorites clear removes all", () => {
    useFavoritesStore.getState().toggleFavorite("a")
    useFavoritesStore.getState().toggleFavorite("b")
    useFavoritesStore.getState().clear()
    expect(useFavoritesStore.getState().favorites).toHaveLength(0)
  })
})
