import { defineToolManifest } from "@/shared/manifest"

export const manifest = defineToolManifest({
  slug: "markdown-preview",
  title: "Markdown Previewer",
  shortDescription:
    "Write Markdown on the left, see it rendered on the right — live, safe, and in your browser.",
  description:
    "Preview a practical subset of Markdown as you type: headings, lists, nested lists, blockquotes, fenced code, tables with alignment, links, images, emphasis, strikethrough, and inline code. Every character is HTML-escaped by the renderer, so raw HTML or javascript: links in your document can never execute — the preview is safe by construction.",
  categoryId: "text",
  icon: "Type",
  keywords: ["markdown", "preview", "render", "readme", "editor", "md", "documentation"],
  tags: ["text", "markdown", "writing"],
  featured: true,
  popular: true,
  isNew: true,
  tier: "free",
  usage: 980000,
  rating: 4.8,
  trend: "steady",
  trendValue: 0,
  gradient: "from-gold/30 to-gold-2/5",
  version: "1.0.0",
  author: "NEXUS Tools",
  updatedAt: "2026-08-10",
  estimatedProcessing: "live",
  supportedDevices: ["desktop", "tablet", "mobile"],
  supportedBrowsers: ["chrome", "firefox", "safari", "edge"],
  faqs: [
    {
      question: "Is my Markdown uploaded anywhere?",
      answer:
        "No. Markdown is converted to HTML entirely in your browser with dependency-free code. Nothing leaves your device.",
    },
    {
      question: "Does the preview execute raw HTML?",
      answer:
        "Never. Every input character is HTML-escaped before rendering, so raw <script> tags, event-handler attributes, and javascript: links are shown as harmless text instead.",
    },
    {
      question: "Which Markdown features are supported?",
      answer:
        "Headings, paragraphs, ordered and unordered lists (with nesting), blockquotes, fenced code blocks, pipe tables with alignment, links, lazy-loaded images, emphasis, strong, strikethrough, inline code, and horizontal rules.",
    },
  ],
})
