import { defineToolManifest } from "@/shared/manifest"

export const manifest = defineToolManifest({
  slug: "uuid-generator",
  title: "UUID Generator",
  shortDescription: "Create v4 UUIDs in bulk with formatting options and zero tracking.",
  description:
    "Create v4 UUIDs in bulk with formatting options — braces, hyphens, uppercase — and zero tracking. Copy the whole batch in one click.",
  categoryId: "developer",
  icon: "Hash",
  keywords: ["uuid", "guid", "id", "generator", "developers"],
  tags: ["developer", "generator"],
  featured: false,
  popular: false,
  isNew: false,
  tier: "free",
  usage: 1980000,
  rating: 4.8,
  trend: "steady",
  trendValue: 1.4,
  gradient: "from-violet/35 to-violet/5",
  version: "1.0.0",
  author: "NEXUS Tools",
  updatedAt: "2026-08-01",
  estimatedProcessing: "under 2s",
  supportedDevices: ["desktop", "tablet", "mobile"],
  supportedBrowsers: ["chrome", "firefox", "safari", "edge"],
})
