import { create } from "zustand"
import { persist } from "zustand/middleware"

const MAX_RECENT = 8

export interface RecentToolEntry {
  slug: string
  /** Milliseconds since epoch when the tool was last visited. */
  at: number
}

/** Storage migration: legacy shapes (bare slug arrays, or { recents: string[] }) → entries. */
export function migrateRecents(persisted: unknown): { recents: RecentToolEntry[] } | unknown {
  const legacy: string[] | null =
    Array.isArray(persisted) && persisted.every((item) => typeof item === "string")
      ? (persisted as string[])
      : typeof persisted === "object" &&
          persisted !== null &&
          "recents" in persisted &&
          Array.isArray((persisted as { recents: unknown[] }).recents) &&
          (persisted as { recents: unknown[] }).recents.every((item) => typeof item === "string")
        ? ((persisted as { recents: string[] }).recents as string[])
        : null
  if (legacy && legacy.length > 0) {
    const now = Date.now()
    return {
      recents: legacy.slice(0, MAX_RECENT).map((slug) => ({ slug, at: now })),
    }
  }
  return persisted
}

interface RecentsState {
  recents: RecentToolEntry[]
  push: (slug: string) => void
  clear: () => void
}

/**
 * Recently visited tools, newest first, persisted to localStorage.
 * Stores slugs + timestamps only — never tool payloads.
 */
export const useRecentsStore = create<RecentsState>()(
  persist(
    (set) => ({
      recents: [],
      push: (slug) =>
        set((state) => ({
          recents: [
            { slug, at: Date.now() },
            ...state.recents.filter((item) => item.slug !== slug),
          ].slice(0, MAX_RECENT),
        })),
      clear: () => set({ recents: [] }),
    }),
    {
      name: "nexus-recents",
      version: 1,
      migrate: migrateRecents,
    }
  )
)
