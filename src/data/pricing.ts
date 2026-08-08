import { Check, X } from "lucide-react"
import type { Plan } from "@/shared"

export const plans: Plan[] = [
  {
    id: "free",
    name: "Free",
    tagline: "Essential tools for everyday tasks, always available.",
    monthlyPrice: 0,
    yearlyPrice: 0,
    cta: "Start free",
    popular: false,
    features: [
      { name: "120+ core tools", included: true },
      { name: "Standard file size limits", included: true },
      { name: "Community support", included: true },
      { name: "Batch processing", included: false },
      { name: "Priority queue & faster jobs", included: false },
      { name: "Pro-only AI features", included: false },
    ],
  },
  {
    id: "pro",
    name: "Pro",
    tagline: "Power users, creators, and small teams.",
    monthlyPrice: 8,
    yearlyPrice: 72,
    cta: "Go Pro",
    popular: true,
    features: [
      { name: "300+ tools, including AI", included: true },
      { name: "Unlimited file size limits", included: true },
      { name: "Batch & parallel processing", included: true },
      { name: "Priority queue & faster jobs", included: true },
      { name: "Custom export presets", included: true },
      { name: "Priority support", included: true },
    ],
  },
  {
    id: "team",
    name: "Team",
    tagline: "Shared workspaces for growing organisations.",
    monthlyPrice: 24,
    yearlyPrice: 240,
    cta: "Contact sales",
    popular: false,
    features: [
      { name: "Everything in Pro", included: true },
      { name: "Up to 20 seats included", included: true },
      { name: "Shared team presets", included: true },
      { name: "Usage analytics dashboard", included: true },
      { name: "SSO & SCIM provisioning", included: true },
      { name: "Dedicated success manager", included: true },
    ],
  },
]

export const planCheckIcon = Check
export const planXIcon = X

export const savingsNote = "Save 25% with yearly billing."
