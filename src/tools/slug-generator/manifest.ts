import { defineToolManifest } from "@/shared/manifest"

export const manifest = defineToolManifest({
  slug: "slug-generator",
  title: "Slug Generator",
  shortDescription: "Turn any heading or phrase into a clean, URL-ready slug in real time.",
  description:
    "Turn any heading or phrase into a clean, URL-ready slug in real time. Configure separator, case, and length for consistent publishing across platforms.",
  categoryId: "text",
  icon: "Wrench",
  keywords: ["slug", "url", "seo", "link", "text"],
  tags: ["text", "seo", "url"],
  featured: false,
  popular: false,
  isNew: true,
  tier: "free",
  usage: 540000,
  rating: 4.5,
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
