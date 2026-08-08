import { defineToolManifest } from "@/shared/manifest"

export const manifest = defineToolManifest({
  slug: "text-summarizer",
  title: "Text Summarizer",
  shortDescription: "Condense long articles into crisp, readable summaries in one step.",
  description:
    "Condense long articles into crisp, readable summaries in one step — extract key points with control over summary length, all without sending your text anywhere.",
  categoryId: "ai",
  icon: "Sparkles",
  keywords: ["summarize", "ai", "article", "key points", "condense"],
  tags: ["ai", "text", "writing"],
  featured: true,
  popular: false,
  isNew: false,
  tier: "pro",
  usage: 1520000,
  rating: 4.8,
  trend: "up",
  trendValue: 41.3,
  gradient: "from-gold/30 to-gold-2/5",
  version: "1.0.0",
  author: "NEXUS Tools",
  updatedAt: "2026-08-01",
  estimatedProcessing: "under 2s",
  supportedDevices: ["desktop", "tablet", "mobile"],
  supportedBrowsers: ["chrome", "firefox", "safari", "edge"],

  faqs: [
    {
      question: "Does it use a cloud AI model?",
      answer: "No. Summaries are computed locally so your text stays private whatever the plan.",
    },
  ],
})
