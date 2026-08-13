"use client"

import { X } from "lucide-react"
import { useRecentsStore } from "@/store/recents-store"
import { getAllTools } from "@/lib/platform"
import { formatRelativeTime } from "@/lib"
import type { ToolManifest } from "@/shared/manifest"
import { ToolCard } from "@/components/design-system/tool-card"
import { Button } from "@/components/ui/button"

/**
 * "Recently used" strip for the tools directory.
 *
 * Reads only slugs + timestamps from the recents store — no payloads are
 * ever stored or rendered here.
 */
export function RecentlyUsed() {
  const recents = useRecentsStore((state) => state.recents)
  const clear = useRecentsStore((state) => state.clear)

  const toolsBySlug = new Map<string, ToolManifest>(getAllTools().map((tool) => [tool.slug, tool]))
  const visible = recents
    .map((entry) => ({ ...entry, tool: toolsBySlug.get(entry.slug) }))
    .filter((entry): entry is { slug: string; at: number; tool: ToolManifest } =>
      Boolean(entry.tool)
    )
    .slice(0, 4)

  if (visible.length === 0) return null

  return (
    <section aria-label="Recently used tools" className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-semibold tracking-tight text-foreground">Recently used</h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={clear}
          aria-label="Clear recently used tools"
          className="h-8 gap-1.5 text-muted-foreground"
        >
          <X className="size-3.5" aria-hidden="true" />
          Clear
        </Button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {visible.map(({ tool, at }) => (
          <div key={tool.slug} className="flex flex-col gap-2">
            <ToolCard tool={tool} />
            <p className="px-1 text-xs text-muted-foreground">Used {formatRelativeTime(at)}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
