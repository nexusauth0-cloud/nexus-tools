"use client"

import * as React from "react"
import { plans, savingsNote } from "@/data/pricing"
import type { PlanFrequency } from "@/shared"
import { PricingCard } from "./pricing-card"
import { Stagger } from "./motion"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"

export function PricingGrid() {
  const [frequency, setFrequency] = React.useState<PlanFrequency>("monthly")

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col items-center gap-4">
        <div className="flex items-center gap-3">
          <Tabs value={frequency} onValueChange={(value) => setFrequency(value as PlanFrequency)}>
            <TabsList aria-label="Billing frequency">
              <TabsTrigger value="monthly">Monthly</TabsTrigger>
              <TabsTrigger value="yearly">
                Yearly
                <Badge variant="gold" className="ml-1">
                  −25%
                </Badge>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <p className="text-xs text-muted-foreground">{savingsNote}</p>
      </div>

      <Stagger className="grid gap-5 lg:grid-cols-3 lg:gap-6">
        {plans.map((plan) => (
          <PricingCard key={plan.id} plan={plan} frequency={frequency} />
        ))}
      </Stagger>
    </div>
  )
}
