import { defineToolManifest } from "@/shared/manifest"

export const manifest = defineToolManifest({
  slug: "keyword-density",
  title: "Keyword Density Checker",
  shortDescription: "Analyze keyword frequency and density across any text in seconds.",
  description:
    "Analyze keyword frequency and density across any text in seconds, with suggested averages and phrase counts for better content.",
  categoryId: "seo",
  icon: "Search",
  keywords: ["keyword", "density", "seo", "analysis", "content"],
  tags: ["seo", "writing", "analytics"],
  featured: false,
  popular: false,
  isNew: false,
  tier: "free",
  usage: 0,
  rating: 0,
  trend: "steady",
  trendValue: 0,
  gradient: "from-violet/35 to-violet/5",
  version: "1.0.0",
  author: "NEXUS Tools",
  updatedAt: "2026-08-01",
  estimatedProcessing: "under 2s",
  supportedDevices: ["desktop", "tablet", "mobile"],
  supportedBrowsers: ["chrome", "firefox", "safari", "edge"],
})
