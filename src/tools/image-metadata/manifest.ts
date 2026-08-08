import { defineToolManifest } from "@/shared/manifest"

export const manifest = defineToolManifest({
  slug: "image-metadata",
  title: "Image Metadata Viewer",
  shortDescription: "Read EXIF metadata from JPEG, PNG, and WebP files on your device.",
  description:
    "Inspect the metadata hidden inside your images: camera model, exposure settings, timestamps, and lens details. Everything is read directly from the file's bytes in your browser — nothing is uploaded, and GPS presence is noted without exposing coordinates.",
  categoryId: "image",
  icon: "Info",
  keywords: ["metadata", "exif", "camera", "gps", "timestamp", "information", "viewer"],
  tags: ["image", "metadata", "exif"],
  featured: false,
  popular: false,
  isNew: false,
  tier: "free",
  usage: 410000,
  rating: 4.6,
  trend: "steady",
  trendValue: 0,
  gradient: "from-gold/30 to-gold-2/5",
  version: "1.0.0",
  author: "NEXUS Tools",
  updatedAt: "2026-08-01",
  estimatedProcessing: "under 2s",
  supportedDevices: ["desktop", "tablet", "mobile"],
  supportedBrowsers: ["chrome", "firefox", "safari", "edge"],
  capabilities: [
    "file input",
    "client-side processing",
    "metadata inspection",
    "privacy-safe GPS detection",
  ],
})
