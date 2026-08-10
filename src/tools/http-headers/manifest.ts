import { defineToolManifest } from "@/shared/manifest"

export const manifest = defineToolManifest({
  slug: "http-headers",
  title: "HTTP Headers Checker",
  shortDescription: "Inspect response headers a website sends, straight from your browser.",
  description:
    "Check which HTTP response headers a website sends — content type, caching, and the security headers that shape browser behavior. The request goes directly from your browser, reads headers only (never the body), and reports exactly what the browser can see. Headers the server hides from cross-origin access are labelled as hidden rather than fabricated. Findings are observations, not a security audit.",
  categoryId: "seo",
  icon: "FileCode",
  keywords: [
    "http headers",
    "response headers",
    "security headers",
    "cache-control",
    "content-security-policy",
    "header checker",
    "csp",
    "hsts",
  ],
  tags: ["seo", "web", "headers", "security"],
  featured: false,
  popular: false,
  isNew: true,
  tier: "free",
  usage: 480000,
  rating: 4.8,
  trend: "up",
  trendValue: 8.2,
  gradient: "from-violet/35 to-violet/5",
  version: "1.0.0",
  author: "NEXUS Tools",
  updatedAt: "2026-08-10",
  estimatedProcessing: "under 10s",
  supportedDevices: ["desktop", "tablet", "mobile"],
  supportedBrowsers: ["chrome", "firefox", "safari", "edge"],
  faqs: [
    {
      question: "Why do some headers not appear even though the server sends them?",
      answer:
        "Browsers only let a page read response headers sent by its own origin or exposed via Access-Control-Expose-Headers. Headers hidden that way are marked as hidden — NEXUS Tools never proxies the request.",
    },
    {
      question: "Does the checker download the page?",
      answer:
        "No. Only the headers are read and the response body stream is cancelled immediately — nothing is stored or displayed.",
    },
  ],
})
