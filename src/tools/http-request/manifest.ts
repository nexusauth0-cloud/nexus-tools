import { defineToolManifest } from "@/shared/manifest"

export const manifest = defineToolManifest({
  slug: "http-request",
  title: "HTTP Request Builder",
  shortDescription:
    "Send HTTP requests straight from your browser — method, headers, body, response.",
  description:
    "Build and send HTTP requests (GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS) directly from your browser with the Fetch API. Edit headers, choose a JSON/text/form body, measure response time, and inspect status, headers, and body — subject to the destination's CORS policy. NEXUS Tools never proxies requests: there is no server-side fetch of your URLs.",
  categoryId: "developer",
  icon: "Route",
  keywords: ["http", "request", "api", "rest", "headers", "fetch", "client", "curl"],
  tags: ["developer", "http", "api", "debugging"],
  featured: false,
  popular: true,
  isNew: true,
  tier: "free",
  usage: 1680000,
  rating: 4.8,
  trend: "up",
  trendValue: 7.7,
  gradient: "from-violet/35 to-violet/5",
  version: "1.0.0",
  author: "NEXUS Tools",
  updatedAt: "2026-08-12",
  estimatedProcessing: "under 5s",
  supportedDevices: ["desktop", "tablet", "mobile"],
  supportedBrowsers: ["chrome", "firefox", "safari", "edge"],
  capabilities: ["http requests", "header editing", "json body", "response viewer", "cancellation"],
  faqs: [
    {
      question: "Can this tool access any API?",
      answer:
        "Only APIs whose CORS policy allows browser requests. Requests are sent directly from your browser, so the destination server must allow it — the tool never proxies or bypasses CORS.",
    },
    {
      question: "Are my requests or credentials stored?",
      answer:
        "No. History keeps safe metadata only — method, hostname, pathname (without query string), status, and duration. Authorization, cookies, headers, and request bodies are never stored, and response bodies never enter analytics.",
    },
    {
      question: "Why do some responses show no headers?",
      answer:
        "Browsers only expose response headers the destination allows via Access-Control-Expose-Headers. Anything else is simply not readable through fetch — we show what the browser permits.",
    },
  ],
})
