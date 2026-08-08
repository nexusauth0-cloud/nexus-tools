import { defineToolManifest } from "@/shared/manifest"

export const manifest = defineToolManifest({
  slug: "image-compressor",
  title: "Image Compressor",
  shortDescription: "Compress JPEG, PNG, and WebP images with smart, lossless-aware quality.",
  description:
    "Squeeze the bytes without the artifacts. Upload or paste an image and NEXUS picks the smartest compression strategy per format — entirely on your device. Preview the trade-off between size and quality with a live before-and-after slider.",
  categoryId: "image",
  icon: "Shrink",
  keywords: ["compress", "optimize", "shrink", "webp", "jpeg", "png", "file size"],
  tags: ["image", "optimization", "webp"],
  featured: true,
  popular: true,
  isNew: false,
  tier: "free",
  usage: 3420000,
  rating: 4.9,
  trend: "up",
  trendValue: 18.4,
  gradient: "from-gold/30 to-gold-2/5",
  version: "1.0.0",
  author: "NEXUS Tools",
  updatedAt: "2026-08-01",
  estimatedProcessing: "under 2s",
  supportedDevices: ["desktop", "tablet", "mobile"],
  supportedBrowsers: ["chrome", "firefox", "safari", "edge"],
  capabilities: [
    "file input",
    "image preview",
    "lossy and lossless output",
    "download",
    "client-side processing",
  ],

  faqs: [
    {
      question: "Where are my images processed?",
      answer: "On your device. Files never leave your browser, so compression stays private.",
    },
  ],
})
