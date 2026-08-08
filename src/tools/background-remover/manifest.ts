import { defineToolManifest } from "@/shared/manifest"

export const manifest = defineToolManifest({
  slug: "background-remover",
  title: "Background Remover",
  shortDescription: "Remove image backgrounds with AI-powered edge detection on-device.",
  description:
    "Strip backgrounds with on-device edge detection tuned for hair, fur, and tricky edges. Export transparent PNGs or replace the backdrop with a solid color. No uploads, no waiting rooms.",
  categoryId: "image",
  icon: "Eraser",
  keywords: ["background", "remove", "transparent", "cutout", "ai", "png"],
  tags: ["image", "ai", "cutout"],
  featured: true,
  popular: false,
  isNew: false,
  tier: "pro",
  usage: 1780000,
  rating: 4.7,
  trend: "up",
  trendValue: 32.7,
  gradient: "from-gold/30 to-gold-2/5",
  version: "1.0.0",
  author: "NEXUS Tools",
  updatedAt: "2026-08-01",
  estimatedProcessing: "under 2s",
  supportedDevices: ["desktop", "tablet", "mobile"],
  supportedBrowsers: ["chrome", "firefox", "safari", "edge"],

  faqs: [
    {
      question: "Do you store my photos?",
      answer:
        "Never. The entire cutout runs in your browser and everything is discarded when you close the tab.",
    },
  ],
})
