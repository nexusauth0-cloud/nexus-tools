import { defineToolManifest } from "@/shared/manifest"

export const manifest = defineToolManifest({
  slug: "color-converter",
  title: "Color Converter",
  shortDescription: "Convert colors between HEX, RGB, HSL, HSV, CMYK and named colors.",
  description:
    "Convert colors between HEX, RGB, HSL, HSV, CMYK, and named colors like orange or grey — with a live preview, per-format copy buttons, and strict validation: out-of-range values are reported instead of silently clamped. All conversions run locally in your browser.",
  categoryId: "developer",
  icon: "Palette",
  keywords: ["color", "hex", "rgb", "hsl", "hsv", "cmyk", "converter"],
  tags: ["developer", "design", "color"],
  featured: false,
  popular: true,
  isNew: true,
  tier: "free",
  usage: 2150000,
  rating: 4.8,
  trend: "steady",
  trendValue: 3.2,
  gradient: "from-violet/35 to-violet/5",
  version: "1.0.0",
  author: "NEXUS Tools",
  updatedAt: "2026-08-08",
  estimatedProcessing: "under 2s",
  supportedDevices: ["desktop", "tablet", "mobile"],
  supportedBrowsers: ["chrome", "firefox", "safari", "edge"],
  faqs: [
    {
      question: "Which formats are supported?",
      answer:
        "HEX (#rgb and #rrggbb), rgb(r, g, b), hsl(h, s%, l%), hsv(h, s%, v%), cmyk(c%, m%, y%, k%) and named colors such as orange, grey, magenta or pink.",
    },
    {
      question: "Are out-of-range values clamped?",
      answer:
        "No. Invalid channel values are rejected with a clear error so you know exactly why a value was not converted.",
    },
    {
      question: "Why is the output lowercase hex?",
      answer:
        "The modern converter normalizes hex to lowercase, matching CSS best practice. The legacy tool on the old /t/color route emitted uppercase — that route now redirects here.",
    },
  ],
})
