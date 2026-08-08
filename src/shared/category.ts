import type { IconName } from "./icons"

/** Presentation model for a category derived from the tool registry. */
export interface ToolCategory {
  id: string
  name: string
  description: string
  icon: IconName
  /** Tailwind gradient stops used on the icon tile, e.g. "from-gold/25 to-gold-2/5". */
  gradient: string
  /** Tailwind text color for the icon tile. */
  tint: string
  /** Featured categories surface on the homepage. */
  featured: boolean
  /** Number of registered tools in this category. */
  toolCount: number
}
