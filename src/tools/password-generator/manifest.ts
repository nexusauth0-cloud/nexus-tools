import { defineToolManifest } from "@/shared/manifest"

export const manifest = defineToolManifest({
  slug: "password-generator",
  title: "Password Generator",
  shortDescription: "Create cryptographically strong passwords with full control over entropy.",
  description:
    "Create cryptographically strong passwords or passphrases with sliders for length, character sets, and entropy read-outs. Copy and we store nothing.",
  categoryId: "security",
  icon: "Lock",
  keywords: ["password", "generate", "secure", "random", "passphrase"],
  tags: ["security", "generator"],
  featured: true,
  popular: true,
  isNew: false,
  tier: "free",
  usage: 2740000,
  rating: 4.9,
  trend: "up",
  trendValue: 14.9,
  gradient: "from-gold/30 to-gold-2/5",
  version: "1.0.0",
  author: "NEXUS Tools",
  updatedAt: "2026-08-01",
  estimatedProcessing: "under 2s",
  supportedDevices: ["desktop", "tablet", "mobile"],
  supportedBrowsers: ["chrome", "firefox", "safari", "edge"],
})
