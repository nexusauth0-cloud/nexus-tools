import { defineToolManifest } from "@/shared/manifest"

export const manifest = defineToolManifest({
  slug: "hash-generator",
  title: "Hash Generator",
  shortDescription: "Generate MD5, SHA-1, SHA-256, and more digests on-device.",
  description:
    "Generate MD5, SHA-1, SHA-256, SHA-384, and SHA-512 digests from text entirely in your browser. SHA algorithms run on the Web Crypto API; MD5 and SHA-1 are clearly marked as legacy because they are not recommended for security-sensitive use.",
  categoryId: "developer",
  icon: "KeyRound",
  keywords: ["md5", "sha", "hash", "digest", "crypto", "checksum"],
  tags: ["developer", "security", "hashing"],
  featured: false,
  popular: false,
  isNew: true,
  tier: "free",
  usage: 1340000,
  rating: 4.7,
  trend: "steady",
  trendValue: 0,
  gradient: "from-violet/35 to-violet/5",
  version: "1.1.0",
  author: "NEXUS Tools",
  updatedAt: "2026-08-08",
  estimatedProcessing: "under 2s",
  supportedDevices: ["desktop", "tablet", "mobile"],
  supportedBrowsers: ["chrome", "firefox", "safari", "edge"],
  faqs: [
    {
      question: "Is MD5 or SHA-1 secure?",
      answer:
        "No. MD5 and SHA-1 are cryptographic broken and only supported for legacy checksums. Prefer SHA-256 or SHA-512 for any security-relevant use.",
    },
    {
      question: "Does my text leave the browser?",
      answer:
        "No. Hashing happens on your device — Web Crypto for SHA, and a runtime library for MD5.",
    },
  ],
})
