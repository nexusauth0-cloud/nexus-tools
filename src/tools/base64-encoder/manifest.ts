import { defineToolManifest } from "@/shared/manifest"

export const manifest = defineToolManifest({
  slug: "base64-encoder",
  title: "Base64 Encoder / Decoder",
  shortDescription: "Encode and decode text and files to and from base64 in the browser.",
  description:
    "Encode and decode text, files, and URIs between base64 and its original form, with live character counts and clear copy buttons.",
  categoryId: "developer",
  icon: "Binary",
  keywords: ["base64", "encode", "decode", "binary", "text"],
  tags: ["developer", "encoding"],
  featured: false,
  popular: false,
  isNew: false,
  tier: "free",
  usage: 1460000,
  rating: 4.8,
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
