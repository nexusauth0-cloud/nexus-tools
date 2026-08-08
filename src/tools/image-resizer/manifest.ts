import { defineToolManifest } from "@/shared/manifest"

export const manifest = defineToolManifest({
  slug: "image-resizer",
  title: "Image Resizer",
  shortDescription: "Resize images to exact dimensions or scale by percentage in one click.",
  description:
    "Resize images to exact dimensions or a percentage scale, with smart presets for social cards and thumbnails. Export exact pixels or keep the aspect ratio locked with one click.",
  categoryId: "image",
  icon: "Image",
  keywords: ["resize", "crop", "dimensions", "pixels", "scale", "image"],
  tags: ["image", "resize", "dimensions"],
  featured: false,
  popular: true,
  isNew: false,
  tier: "free",
  usage: 2150000,
  rating: 4.8,
  trend: "up",
  trendValue: 9.2,
  gradient: "from-gold/30 to-gold-2/5",
  version: "1.0.0",
  author: "NEXUS Tools",
  updatedAt: "2026-08-01",
  estimatedProcessing: "under 2s",
  supportedDevices: ["desktop", "tablet", "mobile"],
  supportedBrowsers: ["chrome", "firefox", "safari", "edge"],
})
