import { defineToolManifest } from "@/shared/manifest"
import type { ToolManifest } from "@/shared/manifest"

/**
 * Shared factory for platform tests. Every fixture is a real, valid
 * manifest — the same shape registered tools use.
 */

interface MakeToolOptions {
  slug: string
  categoryId?: string
  title?: string
  keywords?: string[]
  tags?: string[]
  featured?: boolean
  popular?: boolean
  isNew?: boolean
  tier?: "free" | "freemium" | "pro"
  usage?: number
  rating?: number
  trendValue?: number
  updatedAt?: string
  related?: string[]
}

export function makeTool(options: MakeToolOptions): ToolManifest {
  const {
    slug,
    categoryId = "developer",
    title,
    keywords = [],
    tags = [],
    featured = false,
    popular = false,
    isNew = false,
    tier = "free",
    usage = 0,
    rating = 4.5,
    trendValue = 0,
    updatedAt = "2026-08-01",
    related,
  } = options

  return defineToolManifest({
    slug,
    title: title ?? titleFromSlug(slug),
    shortDescription: `A short description for ${slug}.`,
    description: `A longer description for ${slug} that explains what the tool does.`,
    categoryId,
    icon: "Sparkles",
    keywords,
    tags,
    featured,
    popular,
    isNew,
    tier,
    version: "1.0.0",
    author: "NEXUS Tools",
    updatedAt,
    usage,
    rating,
    trend: trendValue > 0 ? "up" : trendValue < 0 ? "down" : "steady",
    trendValue,
    gradient: "from-gold/30 to-gold-2/5",
    ...(related ? { related } : {}),
  })
}

function titleFromSlug(slug: string): string {
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}

export const fixtureTools: ToolManifest[] = [
  makeTool({
    slug: "json-formatter",
    categoryId: "developer",
    keywords: ["json", "format", "validate"],
    tags: ["json", "code"],
    featured: true,
    popular: true,
    usage: 5_000_000,
    rating: 4.9,
    trendValue: 22.6,
  }),
  makeTool({
    slug: "image-compressor",
    categoryId: "image",
    keywords: ["compress", "image", "webp"],
    tags: ["image", "optimization"],
    featured: true,
    usage: 3_400_000,
    rating: 4.9,
    trendValue: 18.4,
  }),
  makeTool({
    slug: "password-generator",
    categoryId: "security",
    keywords: ["password", "secure", "random"],
    tags: ["security"],
    featured: true,
    popular: true,
    usage: 2_700_000,
    rating: 4.8,
    isNew: true,
    updatedAt: "2026-08-10",
  }),
  makeTool({
    slug: "base64-encoder",
    categoryId: "developer",
    keywords: ["base64", "encode", "decode"],
    tags: ["code", "binary"],
    usage: 1_400_000,
    rating: 4.7,
    tier: "freemium",
  }),
  makeTool({
    slug: "svg-optimizer",
    categoryId: "developer",
    keywords: ["svg", "optimize", "minify"],
    tags: ["code", "image"],
    isNew: true,
    usage: 700_000,
    rating: 4.6,
    trendValue: 27.5,
  }),
  makeTool({
    slug: "text-summarizer",
    categoryId: "ai",
    keywords: ["summarize", "ai", "article"],
    tags: ["ai", "writing"],
    featured: true,
    tier: "pro",
    usage: 1_500_000,
    rating: 4.8,
    trendValue: 41.3,
  }),
]
