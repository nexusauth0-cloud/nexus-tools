import { defineToolManifest } from "@/shared/manifest"

export const manifest = defineToolManifest({
  slug: "regex-tester",
  title: "Regex Tester",
  shortDescription: "Compose and test regular expressions with live highlights.",
  description:
    "Test JavaScript regular expressions with live match highlighting, per-match capture groups and named groups, and match indexes. Supports g, i, m, s, u and y flags entirely in your browser — no regex library required, no data leaves your device.",
  categoryId: "developer",
  icon: "Regex",
  keywords: ["regex", "regular expression", "match", "pattern", "capture groups", "flags"],
  tags: ["developer", "regex"],
  featured: false,
  popular: true,
  isNew: true,
  tier: "free",
  usage: 2890000,
  rating: 4.8,
  trend: "up",
  trendValue: 12.1,
  gradient: "from-violet/35 to-violet/5",
  version: "1.1.0",
  author: "NEXUS Tools",
  updatedAt: "2026-08-08",
  estimatedProcessing: "under 2s",
  supportedDevices: ["desktop", "tablet", "mobile"],
  supportedBrowsers: ["chrome", "firefox", "safari", "edge"],
  faqs: [
    {
      question: "Which regex flavor does this tester use?",
      answer:
        "JavaScript's native RegExp engine — the same engine your browser and Node.js use. No separate library or flavor is emulated.",
    },
    {
      question: "Can a slow pattern freeze my browser?",
      answer:
        "Matching runs on the main thread, like any RegExp use. Keep patterns bounded and test against small inputs to avoid catastrophic backtracking.",
    },
  ],
})
