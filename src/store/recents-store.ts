import { create } from "zustand"
import { persist } from "zustand/middleware"

const MAX_RECENT = 8

interface RecentsState {
  recents: string[]
  push: (slug: string) => void
  clear: () => void
}

export const useRecentsStore = create<RecentsState>()(
  persist(
    (set) => ({
      recents: [],
      push: (slug) =>
        set((state) => ({
          recents: [slug, ...state.recents.filter((item) => item !== slug)].slice(0, MAX_RECENT),
        })),
      clear: () => set({ recents: [] }),
    }),
    {
      name: "nexus-recents",
    }
  )
)
