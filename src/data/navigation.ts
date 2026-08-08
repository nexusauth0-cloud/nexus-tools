import { DiscordIcon, GitHubIcon, XIcon } from "@/components/design-system/brand-icons"
import type { NavFooterColumn, SocialLink } from "@/shared"

export const footerColumns: NavFooterColumn[] = [
  {
    title: "Product",
    links: [
      { label: "All Tools", href: "/tools" },
      { label: "Categories", href: "/categories" },
      { label: "Pricing", href: "/pricing" },
      { label: "Blog", href: "/blog" },
      { label: "What's New", href: "/blog" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Contact", href: "/contact" },
      { label: "Brand", href: "/about" },
      { label: "Careers", href: "/about" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
      { label: "Support", href: "/contact" },
      { label: "Status", href: "/contact" },
    ],
  },
]

export const footerSocials: SocialLink[] = [
  { label: "Twitter / X", href: "https://twitter.com", icon: XIcon },
  { label: "GitHub", href: "https://github.com", icon: GitHubIcon },
  { label: "Discord", href: "https://discord.com", icon: DiscordIcon },
]
