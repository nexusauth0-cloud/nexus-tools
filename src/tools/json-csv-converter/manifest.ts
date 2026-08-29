import { defineToolManifest } from "@/shared/manifest"

export const manifest = defineToolManifest({
  slug: "json-csv-converter",
  title: "JSON to CSV Converter",
  shortDescription: "Convert JSON arrays and objects to clean, ready-to-import CSV data.",
  description:
    "Convert JSON arrays and objects to clean, ready-to-import CSVs in seconds. Flatten nested fields, pick columns, and download a tidy spreadsheet instantly.",
  categoryId: "converters",
  icon: "FileJson",
  keywords: ["json", "csv", "convert", "spreadsheet", "data"],
  tags: ["converters", "data", "json"],
  featured: false,
  popular: false,
  isNew: false,
  tier: "free",
  usage: 0,
  rating: 0,
  trend: "steady",
  trendValue: 0,
  gradient: "from-violet/35 to-violet/5",
  version: "1.0.0",
  author: "NEXUS Tools",
  updatedAt: "2026-08-01",
  estimatedProcessing: "under 2s",
  supportedDevices: ["desktop", "tablet", "mobile"],
  supportedBrowsers: ["chrome", "firefox", "safari", "edge"],
})
