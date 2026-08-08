import { Badge } from "@/components/ui/badge"
import type { ToolTier } from "@/shared"

const tierConfig: Record<ToolTier, { label: string; variant: "gold" | "success" | "outline" }> = {
  free: { label: "Free", variant: "success" },
  freemium: { label: "Free + Pro", variant: "outline" },
  pro: { label: "Pro", variant: "gold" },
}

export function ToolStatusBadge({ tier, className }: { tier: ToolTier; className?: string }) {
  const config = tierConfig[tier]
  return (
    <Badge variant={config.variant} className={className}>
      {config.label}
    </Badge>
  )
}
