import { defineToolManifest, type ToolManifest } from "@/shared/manifest"
import type { IconName } from "@/shared/icons"

/**
 * Bridges a static tool declaration (data-sheets/static.yaml) to the
 * platform ToolManifest so static tool pages reuse the existing SEO,
 * layout, breadcrumbs, and metadata stack.
 */

/** Declared icon names → platform IconName values. */
const ICONS: Record<string, IconName> = {
  braces: "Braces",
}

/** Updated-at used for all static tools (kept in sync with the site release date). */
const STATIC_TOOLS_UPDATED_AT = "2026-08-11"

export function staticCategoryId(declCategory: string): string {
  return declCategory
}

export function buildStaticToolManifest(decl: {
  id: string
  title: string
  subtitle?: string
  category: string
  icon: string
  accent?: string
  description: string[]
  hint?: string
  faq?: Array<{ q: string; a: string[] }>
  exampleInput?: string
}): ToolManifest {
  const shortDescription = (decl.subtitle ?? decl.description[0] ?? decl.title).slice(0, 140)
  return defineToolManifest({
    slug: decl.id,
    title: decl.title,
    shortDescription,
    description: `${decl.description[0] ?? decl.hint ?? ""}`.slice(0, 1200),
    categoryId: decl.category,
    icon: ICONS[decl.icon] ?? "Wrench",
    keywords: [decl.id, decl.title, "converter", "online"],
    tags: [decl.category],
    tier: "free",
    updatedAt: STATIC_TOOLS_UPDATED_AT,
    usage: 200_000,
    faqs: decl.faq?.map((entry) => ({ question: entry.q, answer: entry.a.join(" ") })),
    seo: {
      title: `${decl.title} — online converter`,
      description: shortDescription,
      keywords: [decl.id, decl.title],
    },
  })
}