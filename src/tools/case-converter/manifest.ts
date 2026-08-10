import { defineToolManifest } from "@/shared/manifest"

export const manifest = defineToolManifest({
  slug: "case-converter",
  title: "Case Converter",
  shortDescription:
    "Convert text into UPPER, lower, Title, Sentence, camelCase, snake_case, CONSTANT_CASE and more.",
  description:
    "Convert text between twelve Unicode-aware styles: lowercase, UPPERCASE, Title Case, Sentence case, camelCase, PascalCase, snake_case, kebab-case, CONSTANT_CASE, dot.case, slash/case, and tOgGlE. Only letters are case-folded; digits, emoji, and punctuation pass through untouched.",
  categoryId: "text",
  icon: "TextCursor",
  keywords: [
    "uppercase",
    "lowercase",
    "title case",
    "sentence case",
    "camel",
    "pascal",
    "snake",
    "kebab",
    "constant",
    "dot",
    "slash",
    "toggle",
    "text",
  ],
  tags: ["text", "case", "naming"],
  featured: false,
  popular: false,
  isNew: true,
  tier: "free",
  usage: 1120000,
  rating: 4.7,
  trend: "steady",
  trendValue: 0,
  gradient: "from-gold/30 to-gold-2/5",
  version: "1.0.0",
  author: "NEXUS Tools",
  updatedAt: "2026-08-10",
  estimatedProcessing: "live",
  supportedDevices: ["desktop", "tablet", "mobile"],
  supportedBrowsers: ["chrome", "firefox", "safari", "edge"],
  faqs: [
    {
      question: "Does the converter ever delete characters?",
      answer:
        "No. Only Unicode letters are case-folded. Digits, punctuation, emoji, and symbols always pass through unchanged.",
    },
    {
      question: "How are words split for camelCase and snake_case?",
      answer:
        "Words are split on separators plus camelCase and letter-to-digit boundaries, so “camelCase” and “value2” become their own words, and apostrophes keep words like “don’t” together.",
    },
    {
      question: "Is Title Case linguistic?",
      answer:
        "No. Title Case and Sentence case use simple, language-agnostic rules (every word capitalized, or one capitalized after a sentence break), so “iPhone” becomes “Iphone”.",
    },
  ],
})
