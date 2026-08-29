import { defineToolManifest } from "@/shared/manifest"

export const manifest = defineToolManifest({
  slug: "epoch-converter",
  title: "Epoch Converter",
  shortDescription: "Convert Unix timestamps to readable dates and ISO 8601 instantly.",
  description:
    "Convert Unix timestamps to readable dates and ISO 8601 instantly (and back). Paste a log line, get a human date. No install, no account.",
  categoryId: "converters",
  icon: "Clock",
  keywords: ["epoch", "unix", "timestamp", "time", "date", "convert"],
  tags: ["converters", "time", "developer"],
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
