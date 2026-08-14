import { defineToolManifest } from "@/shared/manifest"

export const manifest = defineToolManifest({
  slug: "radix",
  title: "Number Base Converter",
  shortDescription: "Convert integers between bases 2–36",
  description:
    'Type an integer in any base (2–36) and get it in every base at once. The parse rule is deterministic: 0x / 0b / 0o prefixes force hex, binary, or octal; a letter forces the smallest base that contains it ("ff" is hex, "zz" is base 36); bare digits are read as decimal. Values are computed with JavaScript exact integer arithmetic and rejected when they exceed the max safe integer.',
  categoryId: "converters",
  icon: "Binary",
  keywords: ["radix", "base", "hex", "binary", "octal", "decimal", "convert", "number"],
  tags: ["converters", "developer", "data"],
  featured: false,
  popular: true,
  isNew: true,
  tier: "free",
  usage: 780000,
  rating: 4.9,
  trend: "up",
  trendValue: 4.2,
  gradient: "from-gold/30 to-gold-2/5",
  version: "1.0.0",
  author: "NEXUS Tools",
  updatedAt: "2026-08-14",
  estimatedProcessing: "under 2s",
  supportedDevices: ["desktop", "tablet", "mobile"],
  supportedBrowsers: ["chrome", "firefox", "safari", "edge"],
  faqs: [
    {
      question: "How is the base of my input detected?",
      answer:
        'Explicitly by prefix (0x, 0b, 0o), else by letters ("ff" can only be hex, "zz" only base 36), else as decimal. This rule is deterministic and documented so results are never a guess.',
    },
    {
      question: 'Why is "1010" not binary?',
      answer:
        "Because bare digits are read as decimal — a string like 1010 could be valid in many bases, and this tool never guesses silently. Write 0b1010 for binary.",
    },
    {
      question: "What is the largest supported value?",
      answer:
        "The max safe integer, 9,007,199,254,740,991. Larger inputs are rejected with a clear message instead of being rounded.",
    },
  ],
})
