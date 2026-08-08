export const siteConfig = {
  name: "NEXUS Tools",
  shortName: "NEXUS",
  legalName: "NEXUS Tools",
  description:
    "A curated suite of fast, private, and beautifully designed online tools for everyday tasks — image, text, developer, video, audio, and more.",
  url: "https://nexus.tools",
  ogImage: "/opengraph-image",
  twitterHandle: "@nexustools",
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
    twitter: "https://twitter.com",
    github: "https://github.com",
    discord: "https://discord.com",
  },
  supportEmail: "support@nexus.tools",
  version: "1.0.0",
} as const

export type SiteConfig = typeof siteConfig
