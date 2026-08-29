import { defineToolManifest } from "@/shared/manifest"

export const manifest = defineToolManifest({
  slug: "color-extractor",
  title: "Color Extractor",
  shortDescription: "Pull every color from any image into an export-ready palette.",
  description:
    "Pull every color from any image into an export-ready palette — hex, RGB, and HSL with one-click copy and a CSS variables export.",
  categoryId: "image",
  icon: "Palette",
  keywords: ["color", "palette", "image", "hex", "design"],
  tags: ["image", "design", "color"],
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
