"use client"

import { Search, Star } from "lucide-react"
import { cn } from "@/lib"
import { useSearchStore } from "@/store/search-store"
import { useFavoritesStore } from "@/store/favorites-store"
import { Kbd } from "@/components/design-system/kbd"

interface SearchTriggerProps {
  variant?: "header" | "hero"
  className?: string
}

export function SearchTrigger({ variant = "header", className }: SearchTriggerProps) {
  const setOpen = useSearchStore((state) => state.setOpen)
  const favoritesCount = useFavoritesStore((state) => state.favorites.length)

  if (variant === "hero") {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "group flex w-full items-center gap-3 rounded-2xl border border-border bg-card/70 px-5 py-4 text-left shadow-card backdrop-blur transition-all duration-300",
          "hover:border-primary/40 hover:bg-surface hover:shadow-glow-gold focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring",
          className
        )}
        aria-label="Search tools and categories"
      >
        <Search className="size-5 shrink-0 text-gold" aria-hidden="true" />
        <span className="flex-1 truncate text-[15px] text-muted-foreground">
          Search 55 tools, categories, and guides…
        </span>
        <span className="hidden items-center gap-1 sm:flex">
          <Kbd>⌘</Kbd>
          <Kbd>K</Kbd>
        </span>
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      className={cn(
        "inline-flex h-9 items-center gap-2.5 rounded-lg border border-border bg-background/50 px-3 text-sm text-muted-foreground transition-colors hover:border-foreground/20 hover:bg-surface hover:text-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring",
        className
      )}
      aria-label="Search tools and categories"
    >
      <Search className="size-4" aria-hidden="true" />
      <span className="hidden xl:inline">Search</span>
      {favoritesCount > 0 && (
        <span className="inline-flex items-center gap-1 rounded-full bg-gold/15 px-1.5 py-0.5 text-[10px] font-medium text-gold">
          <Star className="size-2.5 fill-gold" aria-hidden="true" />
          {favoritesCount}
        </span>
      )}
      <Kbd className="hidden lg:inline-flex">⌘K</Kbd>
    </button>
  )
}
