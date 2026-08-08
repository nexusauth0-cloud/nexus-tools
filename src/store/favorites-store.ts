import { create } from "zustand"
import { persist } from "zustand/middleware"
import { trackFavoriteToggle } from "@/lib/analytics"

interface FavoritesState {
  favorites: string[]
  isFavorite: (slug: string) => boolean
  toggleFavorite: (slug: string) => void
  clear: () => void
}

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      favorites: [],
      isFavorite: (slug) => get().favorites.includes(slug),
      toggleFavorite: (slug) => {
        const adding = !get().favorites.includes(slug)
        trackFavoriteToggle({ slug, action: adding ? "add" : "remove" })
        set((state) => ({
          favorites: state.favorites.includes(slug)
            ? state.favorites.filter((id) => id !== slug)
            : [...state.favorites, slug],
        }))
      },
      clear: () => set({ favorites: [] }),
    }),
    {
      name: "nexus-favorites",
    }
  )
)
