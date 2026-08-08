import type { ToolManifest } from "@/shared/manifest"
import { getCategoryMeta } from "@/data/category-meta"

export interface BreadcrumbItem {
  label: string
  path: string
}

/**
 * Generates the breadcrumb trail for a tool:
 * Home › Category › Tool.
 */
export function buildBreadcrumbItems(manifest: ToolManifest): BreadcrumbItem[] {
  const category = getCategoryMeta(manifest.categoryId)
  return [
    { label: "Home", path: "/" },
    { label: category.name, path: `/categories/${manifest.categoryId}` },
    { label: manifest.title, path: `/tools/${manifest.slug}` },
  ]
}

export function categoryBreadcrumbItems(categoryId: string): BreadcrumbItem[] {
  return [
    { label: "Home", path: "/" },
    { label: "Categories", path: "/categories" },
    { label: getCategoryMeta(categoryId).name, path: `/categories/${categoryId}` },
  ]
}
