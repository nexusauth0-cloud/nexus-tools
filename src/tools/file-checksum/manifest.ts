import { defineToolManifest } from "@/shared/manifest"

export const manifest = defineToolManifest({
  slug: "file-checksum",
  title: "File Checksum Calculator",
  shortDescription: "Compute SHA-256, SHA-384, SHA-512 or SHA-1 checksums locally.",
  description:
    "Generate a checksum for any file: SHA-256, SHA-384, SHA-512 or SHA-1. Hashes are computed in your browser with incremental reads, so large files never freeze the page and the data never leaves your device.",
  categoryId: "document",
  icon: "Hash",
  keywords: ["checksum", "hash", "sha256", "sha1", "md5", "verify", "integrity", "fingerprint"],
  tags: ["checksum", "hash"],
  featured: false,
  popular: true,
  isNew: true,
  tier: "free",
  usage: 220000,
  rating: 4.7,
  trend: "up",
  trendValue: 9,
  gradient: "from-gold/30 to-gold-2/5",
  version: "1.0.0",
  author: "NEXUS Tools",
  updatedAt: "2026-08-08",
  estimatedProcessing: "depends on file size",
  supportedDevices: ["desktop", "tablet", "mobile"],
  supportedBrowsers: ["chrome", "firefox", "safari", "edge"],
  capabilities: ["file input", "client-side processing", "checksum generation", "download"],
})
