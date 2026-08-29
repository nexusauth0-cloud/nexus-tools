import { defineToolManifest } from "@/shared/manifest"

export const manifest = defineToolManifest({
  slug: "unit-converter",
  title: "Unit Converter",
  shortDescription: "Convert length, mass, volume, temperature, and digital storage units.",
  description:
    "Convert length, mass, volume, temperature, and digital storage units with precision and instant mirroring as you type.",
  categoryId: "finance",
  icon: "Scale",
  keywords: ["units", "convert", "metric", "imperial", "length", "mass"],
  tags: ["converters", "measurement", "math"],
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
