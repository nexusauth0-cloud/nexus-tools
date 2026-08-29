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
    id: "free-forever",
    question: "Is NEXUS Tools really free?",
    answer:
      "Yes — every tool is free, forever. There are no paid plans, trials, or subscriptions, and no account is required. You can verify there's no upgrade path hinted anywhere in the app.",
  },
  {
    id: "limits",
    question: "Are there limits on file sizes?",
    answer:
      "Tools that handle files process them locally in your browser, so the practical limit is your device's memory. We don't impose usage caps or file-size quotas anywhere.",
  },
  {
    id: "previews",
    question: "Why do some tools say 'In the lab'?",
    answer:
      "A few tools are cataloged and on the release board but not live yet. We mark them clearly as public previews with no fabricated usage or ratings, and you can favorite them to know when they ship.",
  },
  {
    id: "browser",
    question: "Which browsers are supported?",
    answer:
      "We support the latest two versions of Chrome, Edge, Firefox, and Safari on desktop, plus their mobile equivalents. Older browsers fall back to a reduced but functional experience.",
  },
]
