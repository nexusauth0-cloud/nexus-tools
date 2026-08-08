"use client"

import { ArrowRight, Check, Crown, X } from "lucide-react"
import { cn, formatPrice } from "@/lib"
import type { Plan, PlanFrequency } from "@/shared"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { StaggerItem } from "./motion"

interface PricingCardProps {
  plan: Plan
  frequency: PlanFrequency
  className?: string
}

export function PricingCard({ plan, frequency, className }: PricingCardProps) {
  const price = frequency === "monthly" ? plan.monthlyPrice : plan.yearlyPrice
  const periodLabel = frequency === "monthly" ? "/ month" : "/ year"

  return (
    <StaggerItem className={cn("h-full", className)}>
      <div
        className={cn(
          "relative flex h-full flex-col gap-6 rounded-2xl border bg-card p-6 shadow-card",
          plan.popular ? "border-primary/40 shadow-glow-gold" : "border-border"
        )}
      >
        {plan.popular && (
          <span className="absolute -top-3 left-1/2 -translate-x-1/2">
            <Badge
              variant="gold"
              className="gap-1.5 px-3 py-1 text-[11px] uppercase tracking-wider shadow-sm"
            >
              <Crown className="size-3" aria-hidden="true" />
              Most popular
            </Badge>
          </span>
        )}

        <div className="flex flex-col gap-1.5">
          <h3 className="text-lg font-semibold tracking-tight text-foreground">{plan.name}</h3>
          <p className="text-sm leading-relaxed text-muted-foreground">{plan.tagline}</p>
        </div>

        <div className="flex items-baseline gap-1.5">
          <span className="text-4xl font-semibold tracking-tight text-foreground tabular-nums">
            {formatPrice(price)}
          </span>
          <span className="text-sm text-muted-foreground">{periodLabel}</span>
        </div>

        <ul className="flex flex-col gap-2.5">
          {plan.features.map((feature) => (
            <li key={feature.name} className="flex items-start gap-2.5 text-sm">
              {feature.included ? (
                <Check className="mt-0.5 size-4 shrink-0 text-gold" aria-hidden="true" />
              ) : (
                <X className="mt-0.5 size-4 shrink-0 text-muted-foreground/50" aria-hidden="true" />
              )}
              <span
                className={cn(
                  "leading-relaxed",
                  feature.included
                    ? "text-foreground"
                    : "text-muted-foreground line-through decoration-muted-foreground/30"
                )}
              >
                {feature.name}
              </span>
            </li>
          ))}
        </ul>

        <div className="mt-auto pt-2">
          <Button
            variant={plan.popular ? "default" : "outline"}
            size="lg"
            className="w-full"
            asChild
          >
            <a href={plan.popular ? "/pricing" : "/pricing"}>
              {plan.cta}
              <ArrowRight className="size-4" aria-hidden="true" />
            </a>
          </Button>
        </div>
      </div>
    </StaggerItem>
  )
}
