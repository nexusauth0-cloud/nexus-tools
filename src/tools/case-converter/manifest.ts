import { defineToolManifest } from "@/shared/manifest"

export const manifest = defineToolManifest({
  slug: "case-converter",
  title: "Case Converter",
  shortDescription: "Convert text between UPPER, lower, Title, camelCase, and snake_case.",
  description:
    "Convert text between UPPER, lower, Title, camelCase, snake_case, and kebab-case. Copy any variant instantly, paste-ready for your editor.",
  categoryId: "text",
  icon: "TextCursor",
  keywords: ["uppercase", "lowercase", "title case", "camel", "snake", "text"],
  tags: ["text", "case", "naming"],
  featured: false,
  popular: false,
  isNew: false,
  tier: "free",
  usage: 1120000,
  rating: 4.7,
  trend: "steady",
  trendValue: 0,
  gradient: "from-gold/30 to-gold-2/5",
  version: "1.0.0",
  author: "NEXUS Tools",
  updatedAt: "2026-08-01",
  estimatedProcessing: "under 2s",
  supportedDevices: ["desktop", "tablet", "mobile"],
  supportedBrowsers: ["chrome", "firefox", "safari", "edge"],
})
