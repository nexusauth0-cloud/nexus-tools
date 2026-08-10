import { defineToolManifest } from "@/shared/manifest"

export const manifest = defineToolManifest({
  slug: "robots-txt-checker",
  title: "Robots.txt Checker",
  shortDescription: "Fetch and dissect a site's robots.txt without touching anything else.",
  description:
    "Read a website's /robots.txt directly from your browser and see every user-agent group, allow/disallow rule, crawl-delay, and sitemap reference — with malformed lines, unknown directives, and suspicious values flagged as issues. The tool only ever requests the site's root robots.txt: nothing else on the site is fetched. Remember, robots.txt is a convention, not an access-control mechanism.",
  categoryId: "seo",
  icon: "Eye",
  keywords: [
    "robots.txt",
    "robots checker",
    "crawl rules",
    "user-agent",
    "disallow",
    "allow",
    "crawl-delay",
    "seo",
  ],
  tags: ["seo", "web", "crawling", "search engines"],
  featured: false,
  popular: false,
  isNew: true,
  tier: "free",
  usage: 410000,
  rating: 4.6,
  trend: "up",
  trendValue: 7.1,
  gradient: "from-violet/35 to-violet/5",
  version: "1.0.0",
  author: "NEXUS Tools",
  updatedAt: "2026-08-10",
  estimatedProcessing: "under 12s",
  supportedDevices: ["desktop", "tablet", "mobile"],
  supportedBrowsers: ["chrome", "firefox", "safari", "edge"],
  faqs: [
    {
      question: "Does robots.txt block access to a website?",
      answer:
        "No. It only tells cooperative crawlers what they may request. Real access control lives in authentication — this tool reports the file's contents, not how well it protects anything.",
    },
    {
      question: "Why is the URL always just the site root robots.txt?",
      answer:
        "robots.txt can only ever live at the root of an origin. The tool always derives it from the host you enter, so no arbitrary server path can be requested.",
    },
  ],
})
