import { defineToolManifest } from "@/shared/manifest"

export const manifest = defineToolManifest({
  slug: "url-encoder",
  title: "URL Encoder / Decoder",
  shortDescription: "Percent-encode and decode URLs with correct reserved-character handling.",
  description:
    "Encode and decode URL components with proper RFC-specific percent-encoding, including reserved characters and form-encoded plus signs.",
  categoryId: "developer",
  icon: "CodeXml",
  keywords: ["url", "encode", "decode", "uri", "percent", "encoding"],
  tags: ["developer", "encoding"],
  featured: false,
  popular: false,
  isNew: true,
  tier: "free",
  usage: 720000,
  rating: 4.7,
  trend: "up",
  trendValue: 5.1,
  gradient: "from-violet/35 to-violet/5",
  version: "1.0.0",
  author: "NEXUS Tools",
  updatedAt: "2026-08-07",
  estimatedProcessing: "under 2s",
  supportedDevices: ["desktop", "tablet", "mobile"],
  supportedBrowsers: ["chrome", "firefox", "safari", "edge"],
  faqs: [
    {
      question: "Why do spaces encode as %20?",
      answer:
        "URLs cannot contain literal spaces. Percent-encoding converts them to %20 (and plus signs, in query strings) per the URL standard.",
    },
  ],
})
