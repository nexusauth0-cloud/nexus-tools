import { defineToolManifest } from "@/shared/manifest"

export const manifest = defineToolManifest({
  slug: "email-header-analyzer",
  title: "Email Header Analyzer",
  shortDescription: "Decode raw email headers to trace routes, delays, and authentication.",
  description:
    "Decode raw email headers to trace routes, delays, and authentication results (SPF, DKIM, DMARC) in a clear, copy-friendly breakdown.",
  categoryId: "developer",
  icon: "Mail",
  keywords: ["email", "header", "spf", "dkim", "trace", "analyze"],
  tags: ["developer", "email", "security"],
  featured: false,
  popular: false,
  isNew: false,
  tier: "freemium",
  usage: 390000,
  rating: 4.5,
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
