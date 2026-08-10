import { defineToolManifest } from "@/shared/manifest"

export const manifest = defineToolManifest({
  slug: "text-to-pdf",
  title: "Text to PDF Converter",
  shortDescription: "Turn plain text into a clean, printable PDF — in your browser.",
  description:
    "Paste plain text, set a title, page size, font size and margins, and get a valid PDF generated locally. Characters outside the WinAnsi set are replaced with a safe placeholder and counted, so you always know exactly what the document contains.",
  categoryId: "document",
  icon: "FileDown",
  keywords: ["pdf", "create", "convert", "text to pdf", "writer", "document", "generate"],
  tags: ["pdf", "converter"],
  featured: true,
  popular: true,
  isNew: true,
  tier: "free",
  usage: 340000,
  rating: 4.8,
  trend: "up",
  trendValue: 15,
  gradient: "from-gold/30 to-gold-2/5",
  version: "1.0.0",
  author: "NEXUS Tools",
  updatedAt: "2026-08-08",
  estimatedProcessing: "under 2s",
  supportedDevices: ["desktop", "tablet", "mobile"],
  supportedBrowsers: ["chrome", "firefox", "safari", "edge"],
  capabilities: ["text input", "client-side processing", "pdf creation", "pdf download"],
})
