import type { ComponentType } from "react"
import type { ToolManifest } from "@/shared/manifest"
import type { ToolCategory } from "@/shared/category"
import { registeredToolComponents, registeredToolManifests } from "@/tools"
import { createToolRegistry, type ToolRegistry } from "./registry"
import { buildToolCategories, formatToolCount, getCategoryToolCount } from "./categories"
import { createSearchEngine } from "./search"
import { computeRelatedTools } from "./related"
import { assertValidRegistry } from "./validation"

/**
 * The single public entry point for the tool platform.
 *
 * Everything — catalog, categories, search, related tools, SEO, breadcrumbs,
 * and tool components — is derived from the registered manifests. UI code
 * should never import `@/tools` or the platform internals directly.
 */

assertValidRegistry(registeredToolManifests)

export const registry: ToolRegistry = createToolRegistry(registeredToolManifests)

export const categories: ToolCategory[] = buildToolCategories(registeredToolManifests)

export function getCategories(): ToolCategory[] {
  return categories
}

const searchEngine = createSearchEngine(registeredToolManifests)

export const toolCount: number = registry.all.length

export function getAllTools(): ToolManifest[] {
  return registry.all
}

export function getTool(slug: string): ToolManifest | undefined {
  return registry.getBySlug(slug)
}

export function getFeaturedTools(): ToolManifest[] {
  return registry.featured
}

export function getPopularTools(): ToolManifest[] {
  return registry.popular
}

export function getNewTools(): ToolManifest[] {
  return registry.new
}

export function getTrendingTools(limit = 6): ToolManifest[] {
  return registry.all
    .filter((tool) => tool.trend === "up")
    .sort((a, b) => b.trendValue - a.trendValue)
    .slice(0, limit)
}

export function getPremiumTools(): ToolManifest[] {
  return registry.premium
}

export function getToolsByCategory(categoryId: string): ToolManifest[] {
  return registry.byCategory(categoryId)
}

export function getCategory(slug: string): ToolCategory | undefined {
  return categories.find((category) => category.id === slug)
}

export function getFeaturedCategories(): ToolCategory[] {
  return categories.filter((category) => category.featured)
}

export function getNavCategories(limit = 6): ToolCategory[] {
  return categories.slice(0, limit)
}

export function getRelatedTools(slug: string, limit = 3): ToolManifest[] {
  return computeRelatedTools(registeredToolManifests, slug, { limit })
}

export function searchTools(options: {
  query?: string
  categoryId?: string
  premiumOnly?: boolean
  featuredOnly?: boolean
  sort?: "relevance" | "popularity" | "newest" | "rating"
  limit?: number
}): ToolManifest[] {
  const { categoryId, premiumOnly, featuredOnly, sort, limit } = options
  const results = searchEngine.search({
    query: options.query ?? "",
    categoryId,
    premiumOnly,
    featuredOnly,
    sort,
  })
  const capped = typeof limit === "number" ? results.slice(0, limit) : results
  return capped.map((result) => result.tool)
}

export function getToolComponent(slug: string): ComponentType<{ className?: string }> | undefined {
  return registeredToolComponents[slug]
}

export function getCategoryToolCountFor(categoryId: string): number {
  return getCategoryToolCount(categoryId, registeredToolManifests)
}

export function formatToolCountFor(categoryId: string): string {
  return formatToolCount(getCategoryToolCountFor(categoryId))
}

export {
  assertValidRegistry,
  validateManifest,
  validateRegistry,
  type ManifestValidationResult,
} from "./validation"
export { createToolRegistry, type ToolRegistry } from "./registry"
export { buildToolCategories, formatToolCount, getCategoryToolCount } from "./categories"
export {
  createSearchEngine,
  type ToolSearchEngine,
  type ToolSearchOptions,
  type ToolSearchResult,
  type ToolSort,
} from "./search"
export { computeRelatedTools, type RelatedOptions } from "./related"
export { buildBreadcrumbItems, categoryBreadcrumbItems, type BreadcrumbItem } from "./breadcrumbs"
export {
  buildBreadcrumbListJsonLd,
  buildCategoryMetadata,
  buildToolBreadcrumbJsonLd,
  buildToolJsonLd,
  buildToolMetadata,
} from "./seo"
