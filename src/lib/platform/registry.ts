import type { ToolManifest } from "@/shared/manifest"
import { isPremium } from "@/shared/manifest"

/**
 * Pure tool registry built from an arbitrary manifest collection.
 * All derived data (featured/popular/new/related/categories) is computed
 * here — never duplicated in the UI.
 */

export interface ToolRegistry {
  all: ToolManifest[]
  bySlug: Map<string, ToolManifest>
  getBySlug(slug: string): ToolManifest | undefined
  featured: ToolManifest[]
  popular: ToolManifest[]
  new: ToolManifest[]
  premium: ToolManifest[]
  byCategory(categoryId: string): ToolManifest[]
  categoryIds: string[]
}

export function createToolRegistry(manifests: ToolManifest[]): ToolRegistry {
  const all = [...manifests]
  const bySlug = new Map(all.map((manifest) => [manifest.slug, manifest]))

  const featured = all.filter((manifest) => manifest.featured).sort(byPopularity)

  const popular = all
    .filter((manifest) => manifest.popular || isPopularEnough(manifest))
    .sort(byPopularity)

  const newItems = all.filter((manifest) => manifest.isNew).sort((a, b) => byUpdatedAtDesc(a, b))

  const premium = all.filter((manifest) => isPremium(manifest.tier))

  return {
    all,
    bySlug,
    getBySlug: (slug) => bySlug.get(slug),
    featured,
    popular,
    new: newItems,
    premium,
    byCategory: (categoryId) =>
      all.filter((manifest) => manifest.categoryId === categoryId).sort(byPopularity),
    categoryIds: Array.from(new Set(all.map((manifest) => manifest.categoryId))),
  }
}

function isPopularEnough(manifest: ToolManifest): boolean {
  return manifest.usage >= 1_000_000
}

function byPopularity(a: ToolManifest, b: ToolManifest): number {
  return b.usage - a.usage
}

function byUpdatedAtDesc(a: ToolManifest, b: ToolManifest): number {
  return b.updatedAt.localeCompare(a.updatedAt)
}
