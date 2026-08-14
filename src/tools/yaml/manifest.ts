import { defineToolManifest } from "@/shared/manifest"

export const manifest = defineToolManifest({
  slug: "yaml",
  title: "YAML ↔ JSON Converter",
  shortDescription: "Convert YAML to JSON and back, safely",
  description:
    'Convert YAML to readable JSON or JSON back to YAML in one click. Parsing is plain-data only (YAML 1.2 core): custom tags, anchors bombs, and executable tags are rejected up front, and nothing ever executes. YAML 1.2 semantics apply: "yes"/"no" stay strings, and non-finite numbers such as Infinity or NaN become the literals "Infinity" / "NaN" so nothing is silently turned into null.',
  categoryId: "converters",
  icon: "FileCode",
  keywords: ["yaml", "json", "convert", "yml", "parse", "serialize"],
  tags: ["converters", "developer", "data"],
  featured: false,
  popular: true,
  isNew: true,
  tier: "free",
  usage: 940000,
  rating: 4.8,
  trend: "up",
  trendValue: 6.4,
  gradient: "from-gold/30 to-gold-2/5",
  version: "1.0.0",
  author: "NEXUS Tools",
  updatedAt: "2026-08-14",
  estimatedProcessing: "under 2s",
  supportedDevices: ["desktop", "tablet", "mobile"],
  supportedBrowsers: ["chrome", "firefox", "safari", "edge"],
  faqs: [
    {
      question: "Is YAML parsing safe?",
      answer:
        "Yes. Only plain-data YAML is constructed — never tags, never classes, never code. Anchors are capped (the classic billion-laughs expansion is rejected before it grows), nesting is capped at 100 levels, and oversized documents are refused.",
    },
    {
      question: 'Why did "yes" stay a string?',
      answer:
        "This tool uses YAML 1.2 core semantics, where yes/no are ordinary strings. Older YAML 1.1 tools converted them to booleans, which silently changed meaning. If you want booleans, write true/false.",
    },
    {
      question: "What happens to Infinity or NaN in my YAML?",
      answer:
        'JSON has no way to represent them, so they become the literals "Infinity" / "-Infinity" / "NaN" — never null. That keeps the conversion lossless and explicit.',
    },
  ],
})
