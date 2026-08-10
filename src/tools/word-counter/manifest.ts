import { defineToolManifest } from "@/shared/manifest"

export const manifest = defineToolManifest({
  slug: "word-counter",
  title: "Word Counter",
  shortDescription: "Count words, characters, sentences, paragraphs, and reading time as you type.",
  description:
    "Count words, characters, sentences, paragraphs, lines, and bytes as you type, with estimated reading and speaking times. Unicode-aware: emoji count as single characters, CJK ideographs are each counted as one word, and every counting rule is documented on the page.",
  categoryId: "text",
  icon: "PenTool",
  keywords: ["word", "character", "count", "sentence", "paragraph", "reading time", "text"],
  tags: ["text", "writing", "analytics"],
  featured: true,
  popular: true,
  isNew: true,
  tier: "free",
  usage: 4010000,
  rating: 4.9,
  trend: "up",
  trendValue: 6.8,
  gradient: "from-gold/30 to-gold-2/5",
  version: "1.0.0",
  author: "NEXUS Tools",
  updatedAt: "2026-08-10",
  estimatedProcessing: "live",
  supportedDevices: ["desktop", "tablet", "mobile"],
  supportedBrowsers: ["chrome", "firefox", "safari", "edge"],
  faqs: [
    {
      question: "Why does each CJK character count as one word?",
      answer:
        "CJK scripts do not use whitespace-separated words, so every ideograph is counted as one word. It is a documented simplification, not a linguistic claim.",
    },
    {
      question: "Are emoji counted as one character?",
      answer:
        "Yes. Characters are Unicode code points, so an emoji like 👋 counts as one character and one length unit.",
    },
    {
      question: "How are reading and speaking times estimated?",
      answer:
        "They use documented average rates of 220 words per minute for silent reading and 140 words per minute for speech. Estimates only — actual times vary.",
    },
  ],
})
