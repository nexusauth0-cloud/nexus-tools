import { defineToolManifest } from "@/shared/manifest"

export const manifest = defineToolManifest({
  slug: "text-differ",
  title: "Text Differ",
  shortDescription: "Compare two blocks of text and see character-level changes instantly.",
  description:
    "Compare two blocks of text and see character-level additions and removals instantly. Merge-mode hints make it a breeze for copy, configs, and code.",
  categoryId: "text",
  icon: "Diff",
  keywords: ["diff", "compare", "changes", "merge", "text"],
  tags: ["text", "compare"],
  featured: true,
  popular: false,
  isNew: false,
  tier: "free",
  usage: 820000,
  rating: 4.6,
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
