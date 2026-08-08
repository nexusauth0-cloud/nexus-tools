import type { IconName } from "@/shared/icons"

/**
 * Editorial metadata for categories.
 *
 * Membership and tool counts are derived from the tool registry — never
 * duplicated here. This file only supplies the human-facing presentation
 * (name, description, icon, styling) for each category id.
 */

export interface CategoryMeta {
  name: string
  description: string
  icon: IconName
  /** Tailwind gradient stops used on the icon tile. */
  gradient: string
  /** Tailwind text color for the icon tile. */
  tint: string
  featured?: boolean
  /** Tocall weight used to order categories in navigation, lower first. */
  sortOrder?: number
}

export const categoryMeta: Record<string, CategoryMeta> = {
  image: {
    name: "Image Tools",
    description: "Resize, compress, crop, and convert images with pixel-perfect precision.",
    icon: "Image",
    gradient: "from-gold/30 to-gold-2/5",
    tint: "text-gold",
    featured: true,
    sortOrder: 1,
  },
  text: {
    name: "Text Tools",
    description: "Count, format, diff, and transform text in a private, instant workspace.",
    icon: "FileText",
    gradient: "from-gold/30 to-gold-2/5",
    tint: "text-gold",
    featured: true,
    sortOrder: 2,
  },
  developer: {
    name: "Developer Tools",
    description: "JSON, regex, base64, hashing, and code utilities built for engineers.",
    icon: "CodeXml",
    gradient: "from-violet/30 to-violet/5",
    tint: "text-violet",
    featured: true,
    sortOrder: 3,
  },
  converters: {
    name: "Converters",
    description: "Swap file formats across documents, media, and data with one click.",
    icon: "ArrowLeftRight",
    gradient: "from-violet/30 to-violet/5",
    tint: "text-violet",
    featured: true,
    sortOrder: 4,
  },
  security: {
    name: "Security & Privacy",
    description: "Hash, generate, and protect credentials entirely on your device.",
    icon: "Shield",
    gradient: "from-gold/30 to-gold-2/5",
    tint: "text-gold",
    featured: false,
    sortOrder: 5,
  },
  productivity: {
    name: "Productivity",
    description: "Task, time, and note utilities that keep a tight workflow.",
    icon: "Briefcase",
    gradient: "from-violet/30 to-violet/5",
    tint: "text-violet",
    featured: true,
    sortOrder: 6,
  },
  seo: {
    name: "SEO Tools",
    description: "Audit metadata, keywords, and content health for better rankings.",
    icon: "Search",
    gradient: "from-violet/30 to-violet/5",
    tint: "text-violet",
    featured: false,
    sortOrder: 7,
  },
  ai: {
    name: "AI & Automation",
    description: "Summarize, rewrite, and generate text with local-first intelligence.",
    icon: "Sparkles",
    gradient: "from-violet/30 to-violet/5",
    tint: "text-violet",
    featured: true,
    sortOrder: 8,
  },
  finance: {
    name: "Finance & Math",
    description: "Calculators and converters for money, rates, and units.",
    icon: "Calculator",
    gradient: "from-gold/30 to-gold-2/5",
    tint: "text-gold",
    featured: false,
    sortOrder: 9,
  },
  video: {
    name: "Video Tools",
    description: "Trim, transcode, and compress video without leaving your browser.",
    icon: "Video",
    gradient: "from-gold/30 to-gold-2/5",
    tint: "text-gold",
    featured: false,
    sortOrder: 10,
  },
  audio: {
    name: "Audio Tools",
    description: "Convert, cut, and normalize audio files with lossless quality.",
    icon: "Music",
    gradient: "from-gold/30 to-gold-2/5",
    tint: "text-gold",
    featured: false,
    sortOrder: 11,
  },
  social: {
    name: "Social & Marketing",
    description: "Plan, schedule, and size content for every social platform.",
    icon: "Share2",
    gradient: "from-gold/30 to-gold-2/5",
    tint: "text-gold",
    featured: false,
    sortOrder: 12,
  },
}

/** Fallback used for categories without explicit metadata. */
const DEFAULT_META: Omit<CategoryMeta, "name"> = {
  description: "Tools curated for this workflow.",
  icon: "Layers",
  gradient: "from-violet/30 to-violet/5",
  tint: "text-violet",
  featured: false,
  sortOrder: 999,
}

/** Registered category ids. A manifest must reference one of these. */
export const knownCategoryIds: readonly string[] = Object.keys(categoryMeta)

export function isKnownCategory(id: string): boolean {
  return id in categoryMeta
}

export function getCategoryMeta(id: string): CategoryMeta {
  return (
    categoryMeta[id] ?? {
      name: titleCase(id),
      ...DEFAULT_META,
    }
  )
}

export function titleCase(input: string): string {
  return input
    .split(/[-_\s]+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}
