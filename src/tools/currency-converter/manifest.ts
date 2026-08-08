import { defineToolManifest } from "@/shared/manifest"

export const manifest = defineToolManifest({
  slug: "currency-converter",
  title: "Currency Converter",
  shortDescription: "Convert between 40+ currencies with up-to-date placeholder rates.",
  description:
    "Convert between 40+ currencies with demo rates, live currency pairs, and a quick-swap for travel, invoices, and ecommerce.",
  categoryId: "finance",
  icon: "Calculator",
  keywords: ["currency", "exchange", "money", "rates", "convert"],
  tags: ["finance", "converters", "money"],
  featured: false,
  popular: false,
  isNew: false,
  tier: "freemium",
  usage: 1760000,
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
