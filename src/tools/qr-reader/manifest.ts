import { defineToolManifest } from "@/shared/manifest"

export const manifest = defineToolManifest({
  slug: "qr-reader",
  title: "QR Code Reader",
  shortDescription: "Decode QR codes from images entirely in your browser — no uploads.",
  description:
    "Scan QR codes from PNG, JPEG, or WebP images with a browser-side decoder. Drag-and-drop or pick a file, and the decoded content is classified heuristically as URL, email, phone, SMS, Wi-Fi, or plain text — always displayed as untrusted data that you choose to act on. Images never leave your device.",
  categoryId: "developer",
  icon: "ScanLine",
  keywords: ["qr", "qr code", "reader", "scanner", "decode", "scan", "qrcode"],
  tags: ["developer", "qr", "reader"],
  featured: false,
  popular: true,
  isNew: true,
  tier: "free",
  usage: 1490000,
  rating: 4.7,
  trend: "up",
  trendValue: 6.9,
  gradient: "from-violet/35 to-violet/5",
  version: "1.0.0",
  author: "NEXUS Tools",
  updatedAt: "2026-08-12",
  estimatedProcessing: "under 2s",
  supportedDevices: ["desktop", "tablet", "mobile"],
  supportedBrowsers: ["chrome", "firefox", "safari", "edge"],
  capabilities: ["qr decoding", "image upload", "drag and drop", "content classification"],
  faqs: [
    {
      question: "Are my images uploaded to a server?",
      answer:
        "No. Decoding runs entirely in your browser. The image is never uploaded and its contents never reach analytics or history.",
    },
    {
      question: "Which image formats are supported?",
      answer:
        "PNG, JPEG, and WebP, up to 10 MB. Larger images are rejected before decoding to keep the page responsive.",
    },
    {
      question: "Can you tell whether a decoded URL is safe?",
      answer:
        "No. Classification is heuristic — the tool shows what it looks like (URL, email, phone…) but never claims certainty, and it never follows a link automatically. You decide which action, if any, to take.",
    },
  ],
})
