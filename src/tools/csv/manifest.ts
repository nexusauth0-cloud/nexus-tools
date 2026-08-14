import { defineToolManifest } from "@/shared/manifest"

export const manifest = defineToolManifest({
  slug: "csv",
  title: "CSV → JSON Converter",
  shortDescription: "Turn CSV with a header row into clean JSON",
  description:
    "Paste any RFC 4180 CSV (comma-separated, quoted fields, CRLF or LF) and get an array of objects keyed by the header row. Quoted fields may contain commas, quotes, and newlines. The first row must be the header, every row must have the same number of fields, and fields longer than 10,000 characters are truncated with an ellipsis so the output stays manageable.",
  categoryId: "converters",
  icon: "Table",
  keywords: ["csv", "json", "convert", "table", "spreadsheet", "parser"],
  tags: ["converters", "data", "developer"],
  featured: false,
  popular: true,
  isNew: true,
  tier: "free",
  usage: 1120000,
  rating: 4.8,
  trend: "up",
  trendValue: 5.1,
  gradient: "from-gold/30 to-gold-2/5",
  version: "1.0.0",
  author: "NEXUS Tools",
  updatedAt: "2026-08-14",
  estimatedProcessing: "under 2s",
  supportedDevices: ["desktop", "tablet", "mobile"],
  supportedBrowsers: ["chrome", "firefox", "safari", "edge"],
  faqs: [
    {
      question: "Why is my CSV rejected?",
      answer:
        "Almost always one of: no header row, rows with different widths, or an unterminated quoted field. The error message points at the row. This converter is strict on purpose — silent data shifts are worse than an error.",
    },
    {
      question: "What happens to very long fields?",
      answer:
        "Cells over 10,000 characters are truncated and marked with an ellipsis. The truncation is per field, so huge documents never break the page.",
    },
    {
      question: "Do I need quotes?",
      answer:
        "Only when a field contains a comma, a quote, or a line break. Plain fields work as-is, and CRLF or LF line endings are both accepted.",
    },
  ],
})
