import { Cpu, FlaskConical, Sparkles, UserX, type LucideIcon } from "lucide-react"
import type { Statistic, StatisticCardData } from "@/shared"

export const statistics: Statistic[] = [
  {
    id: "tools",
    label: "Curated tools",
    value: 55,
    description: "Across image, text, code, converters, documents and more.",
    icon: Sparkles,
  },
  {
    id: "local",
    label: "Runs in your browser",
    value: 100,
    suffix: "%",
    description: "Every tool processes locally on your device. No server, no queue.",
    icon: Cpu,
  },
  {
    id: "accounts",
    label: "Accounts to create",
    value: 0,
    description: "No sign-up, no login, no profile. Just open a tool and go.",
    icon: UserX,
  },
  {
    id: "previews",
    label: "Tools in public preview",
    value: 16,
    description: "Cataloged and on the release board, marked clearly as in the lab.",
    icon: FlaskConical,
  },
]

export const statsOverrides: Record<string, LucideIcon> = {
  tools: Sparkles,
  local: Cpu,
  accounts: UserX,
  previews: FlaskConical,
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
