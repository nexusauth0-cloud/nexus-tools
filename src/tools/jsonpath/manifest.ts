import { defineToolManifest } from "@/shared/manifest"

export const manifest = defineToolManifest({
  slug: "jsonpath",
  title: "JSONPath Tester",
  shortDescription: "Test JSONPath expressions against JSON documents locally.",
  description:
    "Explore JSON documents with JSONPath queries. Paste JSON, enter an expression, and see every match with its canonical path, value, and match count. A dedicated evaluator parses expressions as data — no eval, no script execution — with clear limits on document size, nesting, and results so pathological queries can never freeze your browser.",
  categoryId: "developer",
  icon: "Braces",
  keywords: ["jsonpath", "json", "query", "path", "tester", "api", "extract"],
  tags: ["developer", "json", "query"],
  featured: false,
  popular: false,
  isNew: true,
  tier: "free",
  usage: 720000,
  rating: 4.6,
  trend: "steady",
  trendValue: 2.1,
  gradient: "from-violet/35 to-violet/5",
  version: "1.0.0",
  author: "NEXUS Tools",
  updatedAt: "2026-08-12",
  estimatedProcessing: "under 2s",
  supportedDevices: ["desktop", "tablet", "mobile"],
  supportedBrowsers: ["chrome", "firefox", "safari", "edge"],
  capabilities: ["jsonpath queries", "json validation", "match paths", "result limits"],
  faqs: [
    {
      question: "Which JSONPath features are supported?",
      answer:
        "Root ($), child access (.name and ['name']), array indices ([0], [-1]), wildcards ([*]), recursive descent ($..name), slices ([start:end:step]), unions ([0,1]) and array filters ([?(@.price > 10)]) with literals, comparisons, &&, ||, ! and parentheses. This is a documented subset — not the full unofficial JSONPath spec.",
    },
    {
      question: "Is my JSON sent anywhere?",
      answer:
        "No. Documents are parsed and queried entirely in your browser. History stores only the expression summary and match count.",
    },
    {
      question: "What happens when a query matches a lot of values?",
      answer:
        "Queries are bounded: documents up to 1 MB and 200 levels deep, expressions up to 400 characters, and a maximum of 5000 results. Exceeding a limit fails with a clear explanation — results are never silently cut off.",
    },
  ],
})
