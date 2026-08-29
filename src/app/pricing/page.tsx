import Link from "next/link"
import { ArrowRight, Cpu, FlaskConical, ShieldCheck } from "lucide-react"
import { createMetadata } from "@/lib"
import { PageHeader } from "@/components/design-system/page-header"
import { PricingGrid } from "@/components/design-system/pricing-grid"
import { Reveal, Stagger, StaggerItem } from "@/components/design-system/motion"
import { Button } from "@/components/ui/button"

export const metadata = createMetadata({
  title: "Pricing",
  description:
    "NEXUS Tools is free, forever. Every tool runs in your browser — no accounts, no uploads, no paid plans.",
  path: "/pricing",
})

const facts = [
  {
    icon: Cpu,
    title: "Runs in your browser",
    description: "Every tool processes locally on your device. There are no servers to pay for.",
  },
  {
    icon: ShieldCheck,
    title: "No uploads, no accounts",
    description: "Nothing you work on is sent anywhere. No sign-up, no login, no profile.",
  },
  {
    icon: FlaskConical,
    title: "New tools, clearly marked",
    description:
      "Upcoming tools show as public previews until they ship — we never hide what's live.",
  },
]

export default function PricingPage() {
  return (
    <div className="container-site flex flex-col gap-16 py-16 sm:py-24">
      <PageHeader
        eyebrow="Pricing"
        title="Free, forever."
        description="All 55 tools are yours at no cost — and always will be. No paid tiers, no trials, no lock-in."
      />

      <PricingGrid />

      <Stagger className="grid gap-4 sm:grid-cols-3">
        {facts.map(({ icon: Icon, title, description }) => (
          <StaggerItem key={title}>
            <div className="flex h-full flex-col gap-3 rounded-2xl border border-border bg-card p-6 shadow-card">
              <div className="flex size-10 items-center justify-center rounded-xl border border-primary/20 bg-primary/10">
                <Icon className="size-4.5 text-gold" aria-hidden="true" />
              </div>
              <h3 className="text-sm font-semibold text-foreground">{title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
            </div>
          </StaggerItem>
        ))}
      </Stagger>

      <Reveal className="flex justify-center">
        <Button variant="outline" size="lg" asChild>
          <Link href="/tools">
            Browse all 55 tools
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </Button>
      </Reveal>
    </div>
  )
}
