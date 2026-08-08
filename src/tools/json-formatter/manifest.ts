import { defineToolManifest } from "@/shared/manifest"

export const manifest = defineToolManifest({
  slug: "json-formatter",
  title: "JSON Formatter",
  shortDescription: "Format, validate, minify, and beautify JSON with syntax awareness.",
  description:
    "Format, validate, and minify JSON with syntax awareness. Tree view, path copy, and bracket-pair highlighting make debugging large payloads painless.",
  categoryId: "developer",
  icon: "Braces",
  keywords: ["json", "format", "validate", "minify", "pretty", "parser"],
  tags: ["developer", "json", "parser"],
  featured: true,
  popular: true,
  isNew: false,
  tier: "free",
  usage: 5230000,
  rating: 4.9,
  trend: "up",
  trendValue: 22.6,
  gradient: "from-violet/35 to-violet/5",
  version: "1.0.0",
  author: "NEXUS Tools",
  updatedAt: "2026-08-01",
  estimatedProcessing: "under 2s",
  supportedDevices: ["desktop", "tablet", "mobile"],
  supportedBrowsers: ["chrome", "firefox", "safari", "edge"],

  faqs: [
    {
      question: "Is my JSON sent to a server?",
      answer:
        "No. Formatting and validation happen locally in your browser for instant, private results.",
    },
  ],
})
