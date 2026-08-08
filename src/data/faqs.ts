import type { Faq } from "@/shared"

export const faqs: Faq[] = [
  {
    id: "privacy",
    question: "Do my files leave my device?",
    answer:
      "No. Every tool we ship processes your input locally in the browser. Nothing is uploaded to a server, so there is no file to delete, log, or expose — you can verify this in your browser's network panel.",
  },
  {
    id: "offline",
    question: "Does NEXUS work offline?",
    answer:
      "Yes. Once the app is loaded, most tools run fully offline. Install NEXUS as a PWA from your browser and the core suite keeps working with no connection at all.",
  },
  {
    id: "free-vs-pro",
    question: "What's the difference between Free and Pro?",
    answer:
      "Free includes the core suite of 120+ tools with standard limits, always. Pro unlocks the full 300+ catalog — including AI features, unlimited file sizes, batch processing, and priority queueing.",
  },
  {
    id: "limits",
    question: "Are there limits on file sizes?",
    answer:
      "Free plans cap file sizes to keep the browser environment snappy. Pro lifts those limits entirely, and Team plans add high-volume, parallel processing for heavier workloads.",
  },
  {
    id: "cancel",
    question: "Can I cancel my subscription anytime?",
    answer:
      "Absolutely. You can downgrade or cancel with one click from your account settings, no emails or phone calls required. On yearly plans you keep access until the end of your billing period.",
  },
  {
    id: "browser",
    question: "Which browsers are supported?",
    answer:
      "We support the latest two versions of Chrome, Edge, Firefox, and Safari on desktop, plus their mobile equivalents. Older browsers fall back to a reduced but functional experience.",
  },
]
