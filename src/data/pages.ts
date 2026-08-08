import type { IconName } from "@/shared/icons"

export interface StaticPage {
  title: string
  description: string
  href: string
  icon: IconName
  keywords: string[]
}

export const staticPages: StaticPage[] = [
  {
    title: "All Tools",
    description: "Browse the full catalog of 300+ utilities.",
    href: "/tools",
    icon: "Layers",
    keywords: ["directory", "browse", "all"],
  },
  {
    title: "Categories",
    description: "Explore tools grouped into 12 curated categories.",
    href: "/categories",
    icon: "Layers",
    keywords: ["browse", "list", "groups"],
  },
  {
    title: "Pricing",
    description: "Simple plans that scale with your workflow.",
    href: "/pricing",
    icon: "Rocket",
    keywords: ["plans", "pro", "team", "free"],
  },
  {
    title: "Blog",
    description: "Guides, deep dives, and product notes.",
    href: "/blog",
    icon: "PenTool",
    keywords: ["articles", "guides", "news"],
  },
  {
    title: "About",
    description: "The team and values behind NEXUS Tools.",
    href: "/about",
    icon: "Layers",
    keywords: ["company", "team", "mission"],
  },
  {
    title: "Contact",
    description: "Reach our support and product teams.",
    href: "/contact",
    icon: "PenTool",
    keywords: ["support", "email", "help"],
  },
]
