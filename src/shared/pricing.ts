export type PlanFrequency = "monthly" | "yearly"

export interface PlanFeature {
  name: string
  included: boolean
}

export interface Plan {
  id: string
  name: string
  tagline: string
  monthlyPrice: number
  yearlyPrice: number
  cta: string
  popular: boolean
  features: PlanFeature[]
}
