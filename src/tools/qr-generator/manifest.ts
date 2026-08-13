import { defineToolManifest } from "@/shared/manifest"

export const manifest = defineToolManifest({
  slug: "qr-generator",
  title: "QR Code Generator",
  shortDescription: "Create QR codes for text, URLs, Wi-Fi, email, phone, and SMS on-device.",
  description:
    "Generate QR codes locally in your browser for plain text, URLs, Wi-Fi networks, email, phone numbers, and SMS. Choose the error correction level, size, margin, and colors, then download a PNG or SVG. Payloads are encoded on your device — nothing is uploaded, and Wi-Fi passwords never leave the page.",
  categoryId: "developer",
  icon: "QrCode",
  keywords: ["qr", "qr code", "generator", "wifi qr", "qrcode", "barcode", "scan"],
  tags: ["developer", "qr", "generator"],
  featured: false,
  popular: true,
  isNew: true,
  tier: "free",
  usage: 1850000,
  rating: 4.8,
  trend: "up",
  trendValue: 8.2,
  gradient: "from-violet/35 to-violet/5",
  version: "1.0.0",
  author: "NEXUS Tools",
  updatedAt: "2026-08-12",
  estimatedProcessing: "under 2s",
  supportedDevices: ["desktop", "tablet", "mobile"],
  supportedBrowsers: ["chrome", "firefox", "safari", "edge"],
  capabilities: ["qr generation", "wifi payloads", "png download", "svg download"],
  faqs: [
    {
      question: "Does generating a QR code send my data anywhere?",
      answer:
        "No. The payload is encoded entirely in your browser. Nothing is uploaded, and Wi-Fi passwords are never included in analytics or history.",
    },
    {
      question: "Which QR content types are supported?",
      answer:
        "Plain text, URLs, Wi-Fi (WPA/WPA2, WEP, or open), email with subject and body, phone numbers (tel:) and SMS with message. A URL is stored as data — the tool never checks whether the destination is reachable.",
    },
    {
      question: "Can I customize the QR code appearance?",
      answer:
        "Yes — size, quiet-zone margin, error correction level (L/M/Q/H), and foreground/background colors. Very light foregrounds and dark backgrounds are rejected because they break scanning.",
    },
    {
      question: "What image formats can I download?",
      answer:
        "PNG and SVG, generated locally at up to 1024×1024 pixels to keep downloads reasonable.",
    },
  ],
})
