import { defineToolManifest } from "@/shared/manifest"

export const manifest = defineToolManifest({
  slug: "pdf-to-text",
  title: "PDF to Text Extractor",
  shortDescription: "Extract selectable text from a PDF and copy or download it.",
  description:
    "Pull the text out of a PDF document page by page, then copy, preview or export it as txt, JSON or Markdown. Works with digitally created PDFs; scanned or image-only documents are detected and reported honestly — this tool does not fake OCR results.",
  categoryId: "document",
  icon: "TextCursor",
  keywords: ["pdf", "text", "extract", "convert", "copy", "reader", "ocr"],
  tags: ["pdf", "text", "extraction"],
  featured: false,
  popular: false,
  isNew: true,
  tier: "free",
  usage: 260000,
  rating: 4.5,
  trend: "up",
  trendValue: 12,
  gradient: "from-gold/30 to-gold-2/5",
  version: "1.0.0",
  author: "NEXUS Tools",
  updatedAt: "2026-08-08",
  estimatedProcessing: "under 3s",
  supportedDevices: ["desktop", "tablet", "mobile"],
  supportedBrowsers: ["chrome", "firefox", "safari", "edge"],
  capabilities: ["file input", "client-side processing", "text extraction", "text export"],
})
