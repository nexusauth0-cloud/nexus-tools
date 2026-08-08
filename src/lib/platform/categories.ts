import type { ToolManifest } from "@/shared/manifest"
import type { ToolCategory } from "@/shared/category"
import { getCategoryMeta, knownCategoryIds } from "@/data/category-meta"

/**
 * Derives the category system from the editorial taxonomy plus tool
 * manifests. The full set comes from `category-meta`; counts are always
 * computed from the registry, never stored. A category with zero tools is
 * still browsable (its page renders the "being crafted" empty state) so
 * the catalog can grow into it.
 */

const DEFAULT_GRADIENT = "from-violet/30 to-violet/5"
const DEFAULT_TINT = "text-violet"

export function buildToolCategories(tools: ToolManifest[]): ToolCategory[] {
  const counts = new Map<string, number>(knownCategoryIds.map((id) => [id, 0]))

  for (const tool of tools) {
    counts.set(tool.categoryId, (counts.get(tool.categoryId) ?? 0) + 1)
  }

  return Array.from(counts.entries())
    .map(([id, toolCount]) => {
      const meta = getCategoryMeta(id)
      return {
        id,
        name: meta.name,
        description: meta.description,
        icon: meta.icon,
        gradient: meta.gradient || DEFAULT_GRADIENT,
        tint: meta.tint || DEFAULT_TINT,
        featured: meta.featured ?? false,
        toolCount,
      }
    })
    .sort((a, b) => {
      const orderA = getCategoryMeta(a.id).sortOrder ?? 999
      const orderB = getCategoryMeta(b.id).sortOrder ?? 999
      return orderA - orderB
    })
}

export function getCategoryToolCount(categoryId: string, tools: ToolManifest[]): number {
  let count = 0
  for (const tool of tools) {
    if (tool.categoryId === categoryId) count += 1
  }
  return count
}

export function formatToolCount(count: number): string {
  return `${count} ${count === 1 ? "tool" : "tools"}`
}
