import { defineToolManifest } from "@/shared/manifest"

export const manifest = defineToolManifest({
  slug: "text-differ",
  title: "Text Differ",
  shortDescription:
    "Compare two blocks of text line by line and see exactly what was added and removed.",
  description:
    "Compare two text blocks line by line, with added, removed, and unchanged lines color-coded and counted. The engine uses a deterministic Myers diff (O(ND)) — identical texts short-circuit instantly, and changed lines are reported as remove-plus-insert pairs in modified blocks.",
  categoryId: "text",
  icon: "Diff",
  keywords: ["diff", "compare", "changes", "additions", "removals", "text"],
  tags: ["text", "compare"],
  featured: true,
  popular: false,
  isNew: true,
  tier: "free",
  usage: 820000,
  rating: 4.6,
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
      question: "Is the diff done on my device?",
      answer:
        "Yes. Both texts are compared entirely in your browser with dependency-free code — nothing is uploaded or stored.",
    },
    {
      question: "Is the comparison line-based or character-based?",
      answer:
        "Line-based. You see exactly which lines were added, removed, or unchanged, plus how many modified blocks contain both.",
    },
    {
      question: "How large can the texts be?",
      answer:
        "Each side accepts up to 300,000 characters — roughly a few thousand lines of text. Larger inputs are rejected with a clear message rather than silently truncated.",
    },
  ],
})
