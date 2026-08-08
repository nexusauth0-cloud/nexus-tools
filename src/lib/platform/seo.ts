import type { Metadata } from "next"
import type { ToolManifest } from "@/shared/manifest"
import { isPremium } from "@/shared/manifest"
import { siteConfig } from "@/lib/site"
import { createMetadata } from "@/lib/seo"
import { getCategoryMeta } from "@/data/category-meta"
import { buildBreadcrumbItems, type BreadcrumbItem } from "./breadcrumbs"

function toolPath(slug: string): string {
  return `/tools/${slug}`
}

/**
 * Generates complete Next.js metadata from a tool manifest:
 * title, description, keywords, canonical, OpenGraph, Twitter, robots.
 */
export function buildToolMetadata(manifest: ToolManifest): Metadata {
  const seo = manifest.seo ?? {}
  const title = seo.title ?? manifest.title
  const description = seo.description ?? manifest.shortDescription
  const keywords = seo.keywords ?? [
    ...manifest.keywords,
    ...manifest.tags,
    getCategoryMeta(manifest.categoryId).name,
    "online tool",
    "free tool",
  ]

  return createMetadata({
    title,
    description,
    path: toolPath(manifest.slug),
    keywords,
  })
}

export function buildCategoryMetadata(categoryId: string): Metadata {
  const meta = getCategoryMeta(categoryId)
  return createMetadata({
    title: meta.name,
    description: meta.description,
    path: `/categories/${categoryId}`,
    keywords: [meta.name, "tools", "online tools", "category"],
  })
}

/** JSON-LD structured data (SoftwareApplication) for a tool page. */
export function buildToolJsonLd(manifest: ToolManifest): object {
  const path = toolPath(manifest.slug)
  const premium = isPremium(manifest.tier)

  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: manifest.title,
    description: manifest.shortDescription,
    url: `${siteConfig.url}${path}`,
    applicationCategory: "UtilitiesApplication",
    operatingSystem: "Web",
    softwareVersion: manifest.version,
    dateModified: manifest.updatedAt,
    author: { "@type": "Organization", name: manifest.author },
    offers: {
      "@type": "Offer",
      price: premium ? "4.99" : "0",
      priceCurrency: "USD",
    },
  }
}

/** JSON-LD BreadcrumbList for a tool page. */
export function buildToolBreadcrumbJsonLd(manifest: ToolManifest): object {
  const items = buildBreadcrumbItems(manifest)
  return buildBreadcrumbListJsonLd(items)
}

export function buildBreadcrumbListJsonLd(items: BreadcrumbItem[]): object {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.label,
      item: `${siteConfig.url}${item.path}`,
    })),
  }
}
