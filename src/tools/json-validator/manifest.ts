import { defineToolManifest } from "@/shared/manifest"

export const manifest = defineToolManifest({
  slug: "json-validator",
  title: "JSON Validator",
  shortDescription: "Validate JSON with friendly, line-and-column error messages.",
  description:
    "Validate JSON in your browser with precise, friendly errors that point to the exact line and column. Zero data leaves your device.",
  categoryId: "developer",
  icon: "FileJson",
  keywords: ["json", "validate", "validator", "syntax", "lint", "error"],
  tags: ["developer", "json"],
  featured: false,
  popular: false,
  isNew: true,
  tier: "free",
  usage: 890000,
  rating: 4.8,
  trend: "up",
  trendValue: 9.2,
  gradient: "from-violet/35 to-violet/5",
  version: "1.0.0",
  author: "NEXUS Tools",
  updatedAt: "2026-08-07",
  estimatedProcessing: "under 2s",
  supportedDevices: ["desktop", "tablet", "mobile"],
  supportedBrowsers: ["chrome", "firefox", "safari", "edge"],
  faqs: [
    {
      question: "Is my JSON sent to a server?",
      answer: "No. Validation happens entirely in your browser for instant, private results.",
    },
  ],
})
