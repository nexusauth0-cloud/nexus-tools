import { defineToolManifest } from "@/shared/manifest"

export const manifest = defineToolManifest({
  slug: "timestamp-converter",
  title: "Timestamp Converter",
  shortDescription: "Convert Unix seconds, milliseconds, and ISO 8601 with explicit timezones.",
  description:
    "Convert between Unix seconds, Unix milliseconds, and ISO 8601 dates entirely in your browser. Results always show the explicit timezone (UTC vs your local IANA zone) so you never guess which clock a timestamp refers to.",
  categoryId: "developer",
  icon: "Clock",
  keywords: ["timestamp", "unix", "epoch", "iso 8601", "date", "timezone", "utc"],
  tags: ["developer", "date", "time"],
  featured: false,
  popular: true,
  isNew: true,
  tier: "free",
  usage: 1750000,
  rating: 4.8,
  trend: "up",
  trendValue: 8.4,
  gradient: "from-violet/35 to-violet/5",
  version: "1.0.0",
  author: "NEXUS Tools",
  updatedAt: "2026-08-08",
  estimatedProcessing: "under 2s",
  supportedDevices: ["desktop", "tablet", "mobile"],
  supportedBrowsers: ["chrome", "firefox", "safari", "edge"],
  faqs: [
    {
      question: "Is a timestamp seconds or milliseconds?",
      answer:
        "Seconds timestamps have 10 digits (e.g. 1700000000), milliseconds have 13 (e.g. 1700000000000). This tool lets you pick which unit you are converting from.",
    },
    {
      question: "Does the conversion use my local timezone?",
      answer:
        "Results are shown in both UTC and your browser's local timezone, always with the timezone name explicitly displayed.",
    },
  ],
})
