import { defineToolManifest } from "@/shared/manifest"

export const manifest = defineToolManifest({
  slug: "png-webp-converter",
  title: "PNG to WebP Converter",
  shortDescription: "Batch convert PNG and JPEG images to modern, lighter WebP format.",
  description:
    "Batch convert PNG and JPEG images to modern WebP, gaining 25-35% smaller files with visually identical output. Tune quality per image and download everything as a zip.",
  categoryId: "converters",
  icon: "FileText",
  keywords: ["png", "webp", "convert", "format", "image"],
  tags: ["converters", "image", "webp"],
  featured: false,
  popular: false,
  isNew: false,
  tier: "free",
  usage: 965000,
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
