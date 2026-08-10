import { defineToolManifest } from "@/shared/manifest"

export const manifest = defineToolManifest({
  slug: "url-parser",
  title: "URL Parser",
  shortDescription: "Break any URL into its parts and spot duplicate or tracking parameters.",
  description:
    "Paste a URL and see every component — protocol, host, port, path, query, and hash — plus every query parameter in order, with duplicate keys and empty values flagged and common tracking parameters called out by name. Parsing happens entirely in your browser. Credentials in a URL are never shown: the tool reports their presence, strips them from every output, and only ever mentions them as a warning.",
  categoryId: "seo",
  icon: "SquareCode",
  keywords: [
    "url parser",
    "url parts",
    "query parameters",
    "utm parameters",
    "tracking parameters",
    "url structure",
    "percent encoding",
    "link checker",
  ],
  tags: ["seo", "web", "developer", "links"],
  featured: false,
  popular: false,
  isNew: true,
  tier: "free",
  usage: 610000,
  rating: 4.8,
  trend: "up",
  trendValue: 10.1,
  gradient: "from-violet/35 to-violet/5",
  version: "1.0.0",
  author: "NEXUS Tools",
  updatedAt: "2026-08-10",
  estimatedProcessing: "instant",
  supportedDevices: ["desktop", "tablet", "mobile"],
  supportedBrowsers: ["chrome", "firefox", "safari", "edge"],
  faqs: [
    {
      question: "Are tracking parameters ever removed automatically?",
      answer:
        "No. They are detected and listed, but removing them is a separate explicit action with its own button — the tool never silently rewrites your URL.",
    },
    {
      question: "What happens to credentials in a URL?",
      answer:
        "They are never displayed or stored. The tool flags that a username and/or password is present, then uses a credential-stripped version of the URL for everything that follows.",
    },
  ],
})
