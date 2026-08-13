"use client"

import * as React from "react"
import { AnimatePresence, motion } from "framer-motion"
import { Search, SearchX } from "lucide-react"
import type { ToolSort } from "@/lib/platform"
import { getCategories, searchTools, toolCount } from "@/lib/platform"
import { trackToolSearch } from "@/lib/analytics"
import type { ToolManifest } from "@/shared/manifest"
import { ToolCard } from "@/components/design-system/tool-card"
import { Input } from "@/components/ui/input"
import { useFavoritesStore } from "@/store/favorites-store"
import { RecentlyUsed } from "./recently-used"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

const useFavorites = () => useFavoritesStore((state) => state.favorites)

const sortOptions: { value: ToolSort; label: string }[] = [
  { value: "popularity", label: "Most popular" },
  { value: "rating", label: "Top rated" },
  { value: "newest", label: "Newest" },
]

export function ToolsDirectory() {
  const [query, setQuery] = React.useState("")
  const [category, setCategory] = React.useState<string>("all")
  const [sort, setSort] = React.useState<ToolSort>("popularity")
  const [favoritesOnly, setFavoritesOnly] = React.useState(false)
  const favorites = useFavorites()
  const deferredQuery = React.useDeferredValue(query)
  const categories = React.useMemo(() => getCategories(), [])

  const filtered = React.useMemo(() => {
    const matched = searchTools({
      query: deferredQuery,
      categoryId: category === "all" ? undefined : category,
      sort,
    })
    if (!favoritesOnly) return matched
    return matched.filter((tool: ToolManifest) => favorites.includes(tool.slug))
  }, [deferredQuery, category, sort, favoritesOnly, favorites])

  React.useEffect(() => {
    if (deferredQuery.trim().length >= 2) {
      trackToolSearch({ query: deferredQuery, results: filtered.length })
    }
  }, [deferredQuery, filtered.length])

  return (
    <div className="flex flex-col gap-8">
      <RecentlyUsed />
      <div className="flex flex-wrap items-end gap-4">
        <div className="relative min-w-0 flex-1 basis-64">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            type="search"
            placeholder="Search tools…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="h-11 pl-9"
            aria-label="Search tools"
          />
        </div>

        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="h-11 w-full sm:w-48" aria-label="Filter by category">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {categories.map((item) => (
              <SelectItem key={item.id} value={item.id}>
                {item.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={sort} onValueChange={(value) => setSort(value as ToolSort)}>
          <SelectTrigger className="h-11 w-full sm:w-40" aria-label="Sort tools">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            {sortOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex h-11 items-center gap-2.5">
          <Switch
            id="favorites-only"
            checked={favoritesOnly}
            onCheckedChange={setFavoritesOnly}
            disabled={favorites.length === 0}
          />
          <Label htmlFor="favorites-only" className="whitespace-nowrap text-sm">
            Favorites
            <span className="ml-1 text-muted-foreground tabular-nums">({favorites.length})</span>
          </Label>
        </div>
      </div>

      <p className="text-sm text-muted-foreground" role="status">
        Showing <span className="font-medium text-foreground">{filtered.length}</span> of{" "}
        {toolCount} tools
      </p>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-card/40 px-6 py-16 text-center">
          <SearchX className="size-8 text-muted-foreground" aria-hidden="true" />
          <div className="flex flex-col gap-1">
            <h3 className="text-base font-semibold text-foreground">No tools found</h3>
            <p className="text-sm text-muted-foreground">
              Try a different keyword, category, or clear your filters.
            </p>
          </div>
        </div>
      ) : (
        <motion.div layout className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout" initial={false}>
            {filtered.map((tool) => (
              <ToolCard key={tool.slug} tool={tool} />
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  )
}
