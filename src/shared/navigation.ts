import type { LucideIcon } from "lucide-react"
import type { ComponentType, SVGProps } from "react"

export interface NavItem {
  label: string
  href: string
  description: string
  icon: LucideIcon
}

export interface NavFooterColumn {
  title: string
  links: { label: string; href: string; external?: boolean }[]
}

export type IconComponent = ComponentType<SVGProps<SVGSVGElement>>

export interface SocialLink {
  label: string
  href: string
  icon: IconComponent
}
