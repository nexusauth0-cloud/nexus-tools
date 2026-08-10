import { defineToolManifest } from "@/shared/manifest"

export const manifest = defineToolManifest({
  slug: "pdf-page-counter",
  title: "PDF Page Counter",
  shortDescription: "Count pages in a PDF file instantly, right in your browser.",
  description:
    "Get the precise page count of any PDF in a second — useful before printing, quoting, or splitting documents. The tool also reports the PDF version and file size. Everything is processed locally; nothing is uploaded.",
  categoryId: "document",
  icon: "FileStack",
  keywords: ["pdf", "pages", "count", "page counter", "document", "pages in pdf"],
  tags: ["pdf", "counter"],
  featured: false,
  popular: false,
  isNew: true,
  tier: "free",
  usage: 180000,
  rating: 4.7,
  trend: "up",
  trendValue: 5,
  gradient: "from-gold/30 to-gold-2/5",
  version: "1.0.0",
  author: "NEXUS Tools",
  updatedAt: "2026-08-08",
  estimatedProcessing: "under 2s",
  supportedDevices: ["desktop", "tablet", "mobile"],
  supportedBrowsers: ["chrome", "firefox", "safari", "edge"],
  capabilities: ["file input", "client-side processing", "page counting"],
})
