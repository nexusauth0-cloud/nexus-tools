import type { LucideIcon } from "lucide-react"

export interface BlogAuthor {
  name: string
  role: string
}

export interface BlogContentSection {
  heading: string
  body: string[]
}

export interface BlogPost {
  slug: string
  title: string
  excerpt: string
  category: string
  author: BlogAuthor
  publishedAt: string
  readTime: number
  gradient: string
  tags: string[]
  content: BlogContentSection[]
}

export interface Statistic {
  id: string
  label: string
  value: number
  prefix?: string
  suffix?: string
  decimals?: number
  description: string
  icon: LucideIcon
}

/**
 * Serializable projection of a statistic for Server → Client props.
 */
export type StatisticCardData = Omit<Statistic, "icon">

/**
 * A short Q&A pair. Used by the site-wide FAQ accordion and, with a richer
 * shape, by tool manifests (see `ToolFaq` in `./manifest.ts`).
 */
export interface Faq {
  id: string
  question: string
  answer: string
}
