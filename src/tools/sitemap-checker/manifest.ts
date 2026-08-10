import { defineToolManifest } from "@/shared/manifest"

export const manifest = defineToolManifest({
  slug: "sitemap-checker",
  title: "Sitemap Checker",
  shortDescription: "Parse a sitemap or sitemap index and flag structural problems.",
  description:
    "Feed a sitemap URL (or paste its XML) and get back a clear structural read: how many URLs it lists, what metadata each one carries, and which entries break the sitemaps.org rules — duplicates, missing <loc> tags, invalid URLs, out-of-range priorities, and unknown change frequencies. Sitemap indexes are recognized too, and nested sitemaps are never crawled. Findings describe the document itself, nothing more.",
  categoryId: "seo",
  icon: "Layers",
  keywords: [
    "sitemap",
    "sitemap checker",
    "sitemap index",
    "xml sitemap",
    "urlset",
    "sitemaps.org",
    "lastmod",
    "changefreq",
  ],
  tags: ["seo", "web", "xml", "crawling"],
  featured: false,
  popular: false,
  isNew: true,
  tier: "free",
  usage: 390000,
  rating: 4.7,
  trend: "up",
  trendValue: 6.8,
  gradient: "from-violet/35 to-violet/5",
  version: "1.0.0",
  author: "NEXUS Tools",
  updatedAt: "2026-08-10",
  estimatedProcessing: "under 15s",
  supportedDevices: ["desktop", "tablet", "mobile"],
  supportedBrowsers: ["chrome", "firefox", "safari", "edge"],
  faqs: [
    {
      question: "Will the tool follow a sitemap index into its child sitemaps?",
      answer:
        "No. One document per run — that is the point. It checks the structure of the document you give it and never crawls outward from it.",
    },
    {
      question: "Is a flagged sitemap definitely rejected by search engines?",
      answer:
        "Not necessarily. Flags point at rules in the sitemaps.org specification, but how any given engine treats an edge case is up to that engine.",
    },
  ],
})
