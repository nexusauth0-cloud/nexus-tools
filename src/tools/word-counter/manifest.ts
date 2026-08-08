import { defineToolManifest } from "@/shared/manifest"

export const manifest = defineToolManifest({
  slug: "word-counter",
  title: "Word Counter",
  shortDescription: "Count words, characters, sentences, and reading time as you type.",
  description:
    "Count words, characters, sentences, paragraphs, and reading time as you type. Includes unique-word stats and per-word frequency — a must for writers and editors.",
  categoryId: "text",
  icon: "PenTool",
  keywords: ["word", "character", "count", "sentence", "reading time", "text"],
  tags: ["text", "writing", "analytics"],
  featured: true,
  popular: true,
  isNew: false,
  tier: "free",
  usage: 4010000,
  rating: 4.9,
  trend: "up",
  trendValue: 6.8,
  gradient: "from-gold/30 to-gold-2/5",
  version: "1.0.0",
  author: "NEXUS Tools",
  updatedAt: "2026-08-01",
  estimatedProcessing: "under 2s",
  supportedDevices: ["desktop", "tablet", "mobile"],
  supportedBrowsers: ["chrome", "firefox", "safari", "edge"],
})
