import { defineToolManifest } from "@/shared/manifest"

export const manifest = defineToolManifest({
  slug: "svg-optimizer",
  title: "SVG Optimizer",
  shortDescription: "Minify, clean, and prettify SVG markup while preserving integrity.",
  description:
    "Minify, clean, and prettify SVG markup while preserving integrity — strips metadata, defaults, and whitespace with a before/after size readout.",
  categoryId: "developer",
  icon: "CodeXml",
  keywords: ["svg", "optimize", "minify", "clean", "icons"],
  tags: ["developer", "svg", "optimization"],
  featured: false,
  popular: false,
  isNew: true,
  tier: "free",
  usage: 720000,
  rating: 4.7,
  trend: "up",
  trendValue: 27.5,
  gradient: "from-violet/35 to-violet/5",
  version: "1.0.0",
  author: "NEXUS Tools",
  updatedAt: "2026-08-01",
  estimatedProcessing: "under 2s",
  supportedDevices: ["desktop", "tablet", "mobile"],
  supportedBrowsers: ["chrome", "firefox", "safari", "edge"],
})
