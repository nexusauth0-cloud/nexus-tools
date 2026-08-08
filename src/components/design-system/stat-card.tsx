"use client"

import { cn } from "@/lib"
import type { StatisticCardData } from "@/shared"
import { statsOverrides } from "@/data/statistics"
import { useCountUp } from "@/hooks/use-count-up"
import { StaggerItem } from "./motion"

export function StatCard({ statistic }: { statistic: StatisticCardData }) {
  const Icon = statsOverrides[statistic.id]
  const { ref, value } = useCountUp({
    target: statistic.value,
    decimals: statistic.decimals ?? 0,
  })

  return (
    <StaggerItem className="h-full">
      <div className="flex h-full flex-col gap-3 rounded-2xl border border-border bg-card p-6 shadow-card">
        <div className="flex size-10 items-center justify-center rounded-xl border border-primary/20 bg-primary/10">
          <Icon className="size-4.5 text-gold" aria-hidden="true" />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-3xl font-semibold tracking-tight text-foreground tabular-nums">
            <span ref={ref}>
              {statistic.prefix}
              {value}
              {statistic.suffix}
            </span>
          </span>
          <span className="text-sm font-medium text-muted-foreground">{statistic.label}</span>
        </div>
        <p className={cn("text-xs leading-relaxed text-muted-foreground/80")}>
          {statistic.description}
        </p>
      </div>
    </StaggerItem>
  )
}
