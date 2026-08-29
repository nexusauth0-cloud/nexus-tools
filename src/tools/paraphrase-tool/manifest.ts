import { defineToolManifest } from "@/shared/manifest"

export const manifest = defineToolManifest({
  slug: "paraphrase-tool",
  title: "Paraphrase Tool",
  shortDescription: "Rewrite sentences while keeping meaning, tone, and readability intact.",
  description:
    "Rewrite sentences while keeping meaning, tone, and readability intact. Choose a tone — simple, formal, punchy — and compare before you copy.",
  categoryId: "ai",
  icon: "Wand",
  keywords: ["paraphrase", "rewrite", "ai", "writing", "rephrase"],
  tags: ["ai", "text", "writing"],
  featured: false,
  popular: false,
  isNew: false,
  tier: "free",
  usage: 0,
  rating: 0,
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
