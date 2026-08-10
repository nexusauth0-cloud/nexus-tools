import { defineToolManifest } from "@/shared/manifest"

export const manifest = defineToolManifest({
  slug: "lorem-ipsum",
  title: "Lorem Ipsum Generator",
  shortDescription:
    "Generate realistic placeholder text in paragraphs, sentences, or words — instantly and deterministically.",
  description:
    "Generate lorem ipsum placeholder text in paragraphs, sentences, or words, as plain text, Markdown, or HTML — including the classic “Lorem ipsum dolor sit amet…” opening. Every run is seeded, so the same seed always reproduces the same text, and quantities are capped at documented maximums.",
  categoryId: "text",
  icon: "FileText",
  keywords: [
    "lorem ipsum",
    "placeholder",
    "dummy text",
    "filler text",
    "mockup",
    "wireframe",
    "text generator",
  ],
  tags: ["text", "writing", "generator"],
  featured: false,
  popular: false,
  isNew: true,
  tier: "free",
  usage: 760000,
  rating: 4.7,
  trend: "steady",
  trendValue: 0,
  gradient: "from-gold/30 to-gold-2/5",
  version: "1.0.0",
  author: "NEXUS Tools",
  updatedAt: "2026-08-10",
  estimatedProcessing: "under 2s",
  supportedDevices: ["desktop", "tablet", "mobile"],
  supportedBrowsers: ["chrome", "firefox", "safari", "edge"],
  faqs: [
    {
      question: "Why is the text sometimes different for the same settings?",
      answer:
        "It is never different for the same seed. Each run is seeded deterministically — the same seed always produces the same text. “Randomize seed” picks a fresh one.",
    },
    {
      question: "What is the maximum amount I can generate?",
      answer:
        "500 paragraphs, 2,500 sentences, or 10,000 words per run — whichever mode you pick is rejected above its own documented maximum, never truncated.",
    },
    {
      question: "Is the generated HTML safe to paste?",
      answer:
        "Yes. The HTML output is generated entirely by the tool from its own word list — your input never reaches it, so there is nothing to escape or sanitize.",
    },
  ],
})
