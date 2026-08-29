import { Check } from "lucide-react"
import type { Plan } from "@/shared"

export const plans: Plan[] = [
  {
    id: "free",
    name: "Free, forever",
    tagline: "Every NEXUS tool, at no cost. No trials, no plans, no accounts.",
    monthlyPrice: 0,
    yearlyPrice: 0,
    cta: "Browse the tools",
    popular: true,
    features: [
      { name: "55 fast, private tools", included: true },
      { name: "Every tool runs in your browser", included: true },
      { name: "No uploads, no servers, no queue", included: true },
      { name: "No account or sign-up required", included: true },
      { name: "Installable, offline-friendly PWA", included: true },
      { name: "Free forever — no upgrade path needed", included: true },
    ],
  },
]

export const planCheckIcon = Check
export const planXIcon = Check

export const savingsNote = "Free forever. There is no paid tier."
