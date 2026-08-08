import { defineToolManifest } from "@/shared/manifest"

export const manifest = defineToolManifest({
  slug: "hash-generator",
  title: "Hash Generator",
  shortDescription: "Generate MD5, SHA-1, SHA-256, and more digests with HMAC support.",
  description:
    "Generate MD5, SHA-1, SHA-256, SHA-512, and more digests from text or files, with HMAC support and copy-in-one-click output rows.",
  categoryId: "developer",
  icon: "KeyRound",
  keywords: ["md5", "sha", "hash", "hmac", "digest", "crypto"],
  tags: ["developer", "security", "hashing"],
  featured: false,
  popular: false,
  isNew: false,
  tier: "free",
  usage: 1340000,
  rating: 4.7,
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
