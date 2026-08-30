import { GitHubIcon, TikTokIcon } from "@/components/design-system/brand-icons"
import type { NavFooterColumn, SocialLink } from "@/shared"

export const footerColumns: NavFooterColumn[] = [
  {
    title: "Product",
    links: [
      { label: "Support", href: "/contact" },
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Contact", href: "/contact" },
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
  { label: "GitHub", href: "https://github.com/nexusauth0-cloud", icon: GitHubIcon },
  { label: "TikTok", href: "https://www.tiktok.com/@nexusauth0", icon: TikTokIcon },
]
