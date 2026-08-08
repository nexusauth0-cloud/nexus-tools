import { defineToolManifest } from "@/shared/manifest"

export const manifest = defineToolManifest({
  slug: "regex-tester",
  title: "Regex Tester",
  shortDescription: "Compose, test, and document regular expressions with live matching.",
  description:
    "Compose, test, and document regular expressions with live match highlights, regex explanation, and a test-case runner. Perfect for building patterns before deploy.",
  categoryId: "developer",
  icon: "Regex",
  keywords: ["regex", "regular expression", "match", "pattern", "test"],
  tags: ["developer", "regex"],
  featured: false,
  popular: true,
  isNew: false,
  tier: "free",
  usage: 2890000,
  rating: 4.8,
  trend: "up",
  trendValue: 12.1,
  gradient: "from-violet/35 to-violet/5",
  version: "1.0.0",
  author: "NEXUS Tools",
  updatedAt: "2026-08-01",
  estimatedProcessing: "under 2s",
  supportedDevices: ["desktop", "tablet", "mobile"],
  supportedBrowsers: ["chrome", "firefox", "safari", "edge"],
})
