export const siteConfig = {
  name: "NEXUS Tools",
  shortName: "NEXUS",
  legalName: "NEXUS Tools",
  description:
    "A curated suite of fast, private, and beautifully designed online tools for everyday tasks — image, text, developer, video, audio, and more.",
  url: "https://nexus-tools-delta.vercel.app",
  ogImage: "/opengraph-image",
  keywords: [
    "online tools",
    "free tools",
    "developer tools",
    "image tools",
    "text tools",
    "productivity",
    "file converters",
    "privacy first",
  ],
  links: {
    github: "https://github.com/nexusauth0-cloud",
    tiktok: "https://www.tiktok.com/@nexusauth0",
  },
  supportEmail: "nexusauth0@gmail.com",
  version: "1.0.0",
} as const

export type SiteConfig = typeof siteConfig
