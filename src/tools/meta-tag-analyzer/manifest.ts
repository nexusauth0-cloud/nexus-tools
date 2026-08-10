import { defineToolManifest } from "@/shared/manifest"

export const manifest = defineToolManifest({
  slug: "meta-tag-analyzer",
  title: "Meta Tag Analyzer",
  shortDescription: "Audit a page's titles, descriptions, and social tags from your browser.",
  description:
    "Fetch a page and see exactly what its <title>, meta description, canonical, robots, viewport, and Open Graph / Twitter tags contain, plus heading counts and JSON-LD blocks. The page is fetched directly from your browser and only extracted fields are shown — never the raw content. Guidance is phrased as suggestions about discoverability conventions, not search-engine guarantees.",
  categoryId: "seo",
  icon: "BadgeCheck",
  keywords: [
    "meta tags",
    "seo audit",
    "meta description",
    "open graph",
    "twitter cards",
    "canonical tag",
    "title tag",
    "json-ld",
  ],
  tags: ["seo", "web", "metadata", "social"],
  featured: false,
  popular: false,
  isNew: true,
  tier: "free",
  usage: 520000,
  rating: 4.7,
  trend: "up",
  trendValue: 9.4,
  gradient: "from-violet/35 to-violet/5",
  version: "1.0.0",
  author: "NEXUS Tools",
  updatedAt: "2026-08-10",
  estimatedProcessing: "under 12s",
  supportedDevices: ["desktop", "tablet", "mobile"],
  supportedBrowsers: ["chrome", "firefox", "safari", "edge"],
  faqs: [
    {
      question: "What happens if the page is not HTML?",
      answer:
        "Binary or non-HTML responses are detected before analysis and reported as such — the tool never tries to fake an analysis of an image or a PDF.",
    },
    {
      question: "Are page contents stored or shown?",
      answer:
        "No. Only the extracted metadata fields (and counts) are returned. The raw page body is never stored, displayed, or logged.",
    },
  ],
})
