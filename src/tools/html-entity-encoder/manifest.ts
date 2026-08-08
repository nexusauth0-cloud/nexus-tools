import { defineToolManifest } from "@/shared/manifest"

export const manifest = defineToolManifest({
  slug: "html-entity-encoder",
  title: "HTML Entity Encoder / Decoder",
  shortDescription: "Escape and unescape HTML entities for safer, valid markup.",
  description:
    "Escape the five HTML-significant characters — < > & \" ' — into named entities, and turn named and numeric entities back into characters.",
  categoryId: "developer",
  icon: "FileCode",
  keywords: ["html", "entity", "escape", "encode", "decode", "markup"],
  tags: ["developer", "encoding"],
  featured: false,
  popular: false,
  isNew: true,
  tier: "free",
  usage: 610000,
  rating: 4.7,
  trend: "up",
  trendValue: 3.8,
  gradient: "from-violet/35 to-violet/5",
  version: "1.0.0",
  author: "NEXUS Tools",
  updatedAt: "2026-08-07",
  estimatedProcessing: "under 2s",
  supportedDevices: ["desktop", "tablet", "mobile"],
  supportedBrowsers: ["chrome", "firefox", "safari", "edge"],
  faqs: [
    {
      question: "Why escape HTML characters?",
      answer:
        "Escaping text renders it safely as content rather than markup, protecting pages from broken layout and injected HTML.",
    },
  ],
})
