import { Clock, Sparkles, TrendingUp, Users, type LucideIcon } from "lucide-react"
import type { Statistic, StatisticCardData } from "@/shared"

export const statistics: Statistic[] = [
  {
    id: "tools",
    label: "Curated tools",
    value: 300,
    suffix: "+",
    description: "Production-ready utilities, growing every week.",
    icon: Sparkles,
  },
  {
    id: "runs",
    label: "Tasks completed",
    value: 148,
    suffix: "M",
    description: "Processed entirely inside your browser.",
    icon: TrendingUp,
  },
  {
    id: "privacy",
    label: "Zero uploads",
    value: 100,
    suffix: "%",
    description: "Your data never leaves your device.",
    icon: Users,
  },
  {
    id: "uptime",
    label: "Uptime",
    value: 99.99,
    suffix: "%",
    decimals: 2,
    description: "Measured across every public tool.",
    icon: Clock,
  },
]

export const statsOverrides: Record<string, LucideIcon> = {
  tools: Sparkles,
  runs: TrendingUp,
  privacy: Users,
  uptime: Clock,
}

export function toStatisticCardData(statistic: Statistic): StatisticCardData {
  return {
    id: statistic.id,
    label: statistic.label,
    value: statistic.value,
    prefix: statistic.prefix,
    suffix: statistic.suffix,
    decimals: statistic.decimals,
    description: statistic.description,
  }
}
