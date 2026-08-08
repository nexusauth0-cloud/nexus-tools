import type { IconName } from "@/shared/icons"
import { staticPages } from "@/data/pages"
import { getAllTools, getCategories } from "@/lib/platform"

export type SearchItemType = "page" | "category" | "tool"

export interface SearchItem {
  id: string
  type: SearchItemType
  title: string
  description: string
  href: string
  icon: IconName
  keywords: string[]
  badges?: string[]
}

/**
 * Unified site index for the command palette. Data is owned by the
 * platform (tool manifests + derived categories + static pages) — this
 * module only renders it into `SearchItem`s and scores queries.
 */
export const searchIndex: SearchItem[] = buildSearchIndex()

function buildSearchIndex(): SearchItem[] {
  const pages = staticPages.map<SearchItem>((page) => ({
    id: `page-${page.href}`,
    type: "page",
    title: page.title,
    description: page.description,
    href: page.href,
    icon: page.icon,
    keywords: page.keywords,
  }))

  const categoryItems = getCategories().map<SearchItem>((category) => ({
    id: `category-${category.id}`,
    type: "category",
    title: category.name,
    description: category.description,
    href: `/categories/${category.id}`,
    icon: category.icon,
    keywords: [category.id, "category"],
    badges: [`${category.toolCount} tools`],
  }))

  const toolItems = getAllTools().map<SearchItem>((tool) => {
    return {
      id: `tool-${tool.slug}`,
      type: "tool",
      title: tool.title,
      description: tool.shortDescription,
      href: `/tools/${tool.slug}`,
      icon: tool.icon,
      keywords: [tool.categoryId, ...tool.keywords, ...tool.tags],
      badges: [tool.tier],
    }
  })

  return [...pages, ...categoryItems, ...toolItems]
}

export function searchItems(query: string, limit = 12): SearchItem[] {
  const normalized = query.trim().toLowerCase()
  const terms = normalized.split(/\s+/).filter(Boolean)

  if (terms.length === 0) return searchIndex.slice(0, 8)

  return searchIndex
    .map((item) => {
      const haystack = `${item.title} ${item.description} ${item.keywords.join(" ")}`.toLowerCase()
      let score = 0

      for (const term of terms) {
        if (item.title.toLowerCase().includes(term)) score += 10
        if (item.keywords.some((keyword) => keyword.toLowerCase().includes(term))) score += 6
        if (haystack.includes(term)) score += 3
      }

      return { item, score }
    })
    .filter(({ score }) => score > 0)
    .sort(
      (a, b) =>
        b.score - a.score || (a.item.type === "tool" ? -1 : 0) - (b.item.type === "tool" ? -1 : 0)
    )
    .slice(0, limit)
    .map(({ item }) => item)
}
