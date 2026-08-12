import { z } from "zod"
import { iconNames } from "./icons"

/**
 * Core platform types for tool manifests.
 *
 * A manifest is the single source of truth for a tool. The schema is used
 * both as a runtime validator (dev/build/test) and as the strict TypeScript
 * type that tool authors author against.
 */

export const iconNameSchema = z.enum(iconNames)
export type IconName = z.infer<typeof iconNameSchema>

export const toolTierSchema = z.enum(["free", "freemium", "pro"])
export type ToolTier = z.infer<typeof toolTierSchema>

export const toolTrendSchema = z.enum(["up", "down", "steady"])
export type ToolTrend = z.infer<typeof toolTrendSchema>

export const supportedDeviceSchema = z.enum(["desktop", "tablet", "mobile"])
export type SupportedDevice = z.infer<typeof supportedDeviceSchema>

export const toolFaqSchema = z.object({
  question: z.string().min(4, "FAQ question is too short"),
  answer: z.string().min(4, "FAQ answer is too short"),
})
export type ToolFaq = z.infer<typeof toolFaqSchema>

const toolSeoSchema = z
  .object({
    title: z.string().min(2).optional(),
    description: z.string().min(8).optional(),
    keywords: z.array(z.string()).optional(),
  })
  .optional()

export const toolManifestSchema = z.object({
  /** Unique, URL-safe identifier. Derived from slug; kept for SEO tooling. */
  id: z
    .string()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "id must be a slug")
    .optional(),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "slug must be a valid slug"),
  title: z.string().min(2, "title is too short"),
  shortDescription: z.string().min(8, "shortDescription is too short").max(140),
  description: z.string().min(8, "description is too short"),
  categoryId: z.string().min(1, "categoryId is required"),
  icon: iconNameSchema,
  keywords: z.array(z.string().min(1)).default([]),
  tags: z.array(z.string().min(1)).default([]),
  featured: z.boolean().default(false),
  popular: z.boolean().default(false),
  isNew: z.boolean().default(false),
  tier: toolTierSchema.default("free"),
  version: z
    .string()
    .regex(/^\d+\.\d+\.\d+$/, "version must be semver")
    .default("1.0.0"),
  author: z.string().min(1).default("NEXUS Tools"),
  /** ISO-8601 date, e.g. "2026-08-01". */
  updatedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "updatedAt must be a date"),
  estimatedProcessing: z.string().optional(),
  supportedDevices: z.array(supportedDeviceSchema).optional(),
  supportedBrowsers: z.array(z.enum(["chrome", "firefox", "safari", "edge"])).optional(),
  /** Monthly run count — powers "popular" sorting and cards. */
  usage: z.number().int().nonnegative().default(0),
  rating: z.number().min(0).max(5).default(4.5),
  trend: toolTrendSchema.default("steady"),
  /** Month-over-month change, signed percentage. */
  trendValue: z.number().default(0),
  /** Tailwind gradient stops for the icon tile, e.g. "from-gold/30 to-gold-2/5". */
  gradient: z.string().min(1).default("from-gold/30 to-gold-2/5"),
  /** Optional explicit related-tool slugs. When absent, relations are computed. */
  related: z.array(z.string().min(1)).optional(),
  /** Declared capabilities this tool delivers (e.g. "file input", "image preview"). */
  capabilities: z.array(z.string().min(1)).optional(),
  screenshots: z.array(z.string()).optional(),
  faqs: z.array(toolFaqSchema).optional(),
  seo: toolSeoSchema,
})
export type ToolManifest = z.infer<typeof toolManifestSchema>

/** Authoring helper with full defaults + strict validation. */
export function defineToolManifest(
  input: z.input<typeof toolManifestSchema>,
): ToolManifest {
  return toolManifestSchema.parse(input)
}

/** A tool is premium when it requires a paid plan. */
export function isPremium(tier: ToolTier): boolean {
  return tier !== "free"
}

/** A tool's canonical id always matches its slug. */
export function toolId(manifest: ToolManifest): string {
  return manifest.slug
}
