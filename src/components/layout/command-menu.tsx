"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { ArrowRight, Clock, FolderOpen, LayoutGrid, Star, Wrench } from "lucide-react"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Kbd } from "@/components/design-system/kbd"
import { resolveIcon } from "@/lib/icons"
import { searchItems, type SearchItem, type SearchItemType } from "@/lib/search"
import { useSearchStore } from "@/store/search-store"
import { useKeyboardShortcut } from "@/hooks/use-keyboard-shortcut"
import { useRecentsStore } from "@/store/recents-store"
import { useFavoritesStore } from "@/store/favorites-store"
import { getAllTools } from "@/lib/platform"

const typeMeta: Record<SearchItemType, { label: string; icon: typeof Wrench }> = {
  page: { label: "Pages", icon: LayoutGrid },
  category: { label: "Categories", icon: FolderOpen },
  tool: { label: "Tools", icon: Wrench },
}

const MAX_PERSONALIZED = 5

export function CommandMenu() {
  const router = useRouter()
  const { open, setOpen } = useSearchStore()
  const [query, setQuery] = React.useState("")

  useKeyboardShortcut("k", () => setOpen(!open), { metaKey: true })
  useKeyboardShortcut("k", () => setOpen(!open), { ctrlKey: true })

  const results = React.useMemo(() => searchItems(query), [query])

  const personalized = React.useMemo(() => {
    if (query.trim().length > 0) return null

    const toolsBySlug = new Map(getAllTools().map((t) => [t.slug, t]))

    const recents = useRecentsStore.getState().recents
      .slice(0, MAX_PERSONALIZED)
      .map((entry) => toolsBySlug.get(entry.slug))
      .filter(Boolean) as import("@/shared/manifest").ToolManifest[]

    const favorites = useFavoritesStore.getState().favorites
      .slice(0, MAX_PERSONALIZED)
      .map((slug) => toolsBySlug.get(slug))
      .filter(Boolean) as import("@/shared/manifest").ToolManifest[]

    return { recents, favorites }
  }, [query])

  const groups = React.useMemo(() => {
    const grouped = new Map<SearchItemType, SearchItem[]>()
    for (const item of results) {
      const existing = grouped.get(item.type)
      if (existing) existing.push(item)
      else grouped.set(item.type, [item])
    }
    return grouped
  }, [results])

  const run = React.useCallback(
    (href: string) => {
      setOpen(false)
      setQuery("")
      router.push(href)
    },
    [router, setOpen]
  )

  const groupedOrder: SearchItemType[] = ["tool", "category", "page"]

  return (
    <CommandDialog
      open={open}
      onOpenChange={setOpen}
      title="Search NEXUS Tools"
      description="Search tools, categories, and pages"
    >
      <CommandInput
        placeholder="Search tools, categories, guides…"
        value={query}
        onValueChange={setQuery}
        autoFocus
      />
      <CommandList>
        <CommandEmpty>No results for &quot;{query}&quot;.</CommandEmpty>

        {personalized && (personalized.recents.length > 0 || personalized.favorites.length > 0) && (
          <>
            {personalized.recents.length > 0 && (
              <CommandGroup heading="Recently used">
                {personalized.recents.map((tool) => (
                    <CommandItem
                      key={tool.slug}
                      value={`recent ${tool.title} ${tool.shortDescription}`}
                      onSelect={() => run(`/tools/${tool.slug}`)}
                    >
                      <Clock className="size-4 text-muted-foreground" aria-hidden="true" />
                      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <span className="truncate">{tool.title}</span>
                        <span className="truncate text-xs text-muted-foreground">
                          {tool.shortDescription}
                        </span>
                      </div>
                      <ArrowRight
                        className="ml-1 size-3.5 shrink-0 text-muted-foreground/50"
                        aria-hidden="true"
                      />
                    </CommandItem>
                ))}
              </CommandGroup>
            )}
            {personalized.favorites.length > 0 && (
              <CommandGroup heading="Favorites">
                {personalized.favorites.map((tool) => (
                    <CommandItem
                      key={tool.slug}
                      value={`favorite ${tool.title} ${tool.shortDescription}`}
                      onSelect={() => run(`/tools/${tool.slug}`)}
                    >
                      <Star className="size-4 fill-gold text-gold" aria-hidden="true" />
                      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <span className="truncate">{tool.title}</span>
                        <span className="truncate text-xs text-muted-foreground">
                          {tool.shortDescription}
                        </span>
                      </div>
                      <ArrowRight
                        className="ml-1 size-3.5 shrink-0 text-muted-foreground/50"
                        aria-hidden="true"
                      />
                    </CommandItem>
                ))}
              </CommandGroup>
            )}
          </>
        )}

        {!personalized && groupedOrder.map((type) => {
          const items = groups.get(type)
          if (!items || items.length === 0) return null
          const meta = typeMeta[type]

          return (
            <CommandGroup key={type} heading={meta.label}>
              {items.map((item) => {
                const ItemIcon = resolveIcon(item.icon)
                return (
                  <CommandItem
                    key={item.id}
                    value={`${item.title} ${item.description} ${item.keywords.join(" ")}`}
                    onSelect={() => run(item.href)}
                  >
                    <ItemIcon className="size-4 text-muted-foreground" aria-hidden="true" />
                    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span className="truncate">{item.title}</span>
                      <span className="truncate text-xs text-muted-foreground">
                        {item.description}
                      </span>
                    </div>
                    {item.badges?.map((badge) => (
                      <span
                        key={badge}
                        className="ml-auto rounded-full border border-border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground"
                      >
                        {badge}
                      </span>
                    ))}
                    <ArrowRight
                      className="ml-1 size-3.5 shrink-0 text-muted-foreground/50"
                      aria-hidden="true"
                    />
                  </CommandItem>
                )
              })}
            </CommandGroup>
          )
        })}

        {personalized && query.trim().length === 0 && personalized.recents.length === 0 && personalized.favorites.length === 0 && (
          <>
            {groupedOrder.map((type) => {
              const items = groups.get(type)
              if (!items || items.length === 0) return null
              const meta = typeMeta[type]

              return (
                <CommandGroup key={type} heading={meta.label}>
                  {items.map((item) => {
                    const ItemIcon = resolveIcon(item.icon)
                    return (
                      <CommandItem
                        key={item.id}
                        value={`${item.title} ${item.description} ${item.keywords.join(" ")}`}
                        onSelect={() => run(item.href)}
                      >
                        <ItemIcon className="size-4 text-muted-foreground" aria-hidden="true" />
                        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                          <span className="truncate">{item.title}</span>
                          <span className="truncate text-xs text-muted-foreground">
                            {item.description}
                          </span>
                        </div>
                        {item.badges?.map((badge) => (
                          <span
                            key={badge}
                            className="ml-auto rounded-full border border-border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground"
                          >
                            {badge}
                          </span>
                        ))}
                        <ArrowRight
                          className="ml-1 size-3.5 shrink-0 text-muted-foreground/50"
                          aria-hidden="true"
                        />
                      </CommandItem>
                    )
                  })}
                </CommandGroup>
              )
            })}
          </>
        )}
      </CommandList>

      <div className="flex items-center justify-between border-t border-border bg-card/40 px-3 py-2.5 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <Kbd size="md">↑</Kbd>
          <Kbd size="md">↓</Kbd>
          navigate
        </span>
        <span className="flex items-center gap-1.5">
          <Kbd size="md">↵</Kbd>
          select
        </span>
        <span className="flex items-center gap-1.5">
          <Kbd size="md">esc</Kbd>
          close
        </span>
      </div>
    </CommandDialog>
  )
}
