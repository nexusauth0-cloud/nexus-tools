import { defineToolManifest } from "@/shared/manifest"

export const manifest = defineToolManifest({
  slug: "pdf-metadata",
  title: "PDF Metadata Viewer",
  shortDescription: "View title, author, dates and other metadata inside a PDF file.",
  description:
    "Extract document information from a PDF: title, author, subject, keywords, creator, producer, creation and modification dates — plus the PDF version and page count. The file is parsed locally in your browser and never leaves your device.",
  categoryId: "document",
  icon: "FileText",
  keywords: ["pdf", "metadata", "info", "inspect", "viewer", "document", "reader"],
  tags: ["pdf", "metadata"],
  featured: false,
  popular: false,
  isNew: true,
  tier: "free",
  usage: 120000,
  rating: 4.6,
  trend: "up",
  trendValue: 8,
  gradient: "from-gold/30 to-gold-2/5",
  version: "1.0.0",
  author: "NEXUS Tools",
  updatedAt: "2026-08-08",
  estimatedProcessing: "under 2s",
  supportedDevices: ["desktop", "tablet", "mobile"],
  supportedBrowsers: ["chrome", "firefox", "safari", "edge"],
  capabilities: ["file input", "client-side processing", "metadata inspection"],
})
