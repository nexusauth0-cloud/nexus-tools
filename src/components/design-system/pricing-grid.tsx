"use client"

import { plans, savingsNote } from "@/data/pricing"
import { PricingCard } from "./pricing-card"
import { Stagger } from "./motion"

export function PricingGrid() {
  return (
    <div className="flex flex-col gap-6">
      <p className="text-center text-sm text-muted-foreground">{savingsNote}</p>
      <Stagger className="mx-auto w-full max-w-md">
        {plans.map((plan) => (
          <PricingCard key={plan.id} plan={plan} frequency="monthly" />
        ))}
      </Stagger>
    </div>
  )
}
