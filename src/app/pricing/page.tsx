import Link from "next/link"
import { ArrowRight, ShieldCheck, Sparkles, Wallet } from "lucide-react"
import { createMetadata } from "@/lib"
import { PageHeader } from "@/components/design-system/page-header"
import { PricingGrid } from "@/components/design-system/pricing-grid"
import { Reveal, Stagger, StaggerItem } from "@/components/design-system/motion"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { faqs } from "@/data/faqs"

export const metadata = createMetadata({
  title: "Pricing",
  description:
    "Free forever tools, plus Pro and Team plans with unlimited sizes, batch processing, and priority support.",
  path: "/pricing",
})

const guarantees = [
  {
    icon: Wallet,
    title: "30-day guarantee",
    description: "Not happy? One-click refund, no questions asked.",
  },
  {
    icon: ShieldCheck,
    title: "No lock-in",
    description: "Downgrade or cancel anytime, keep your exports forever.",
  },
  {
    icon: Sparkles,
    title: "Every plan private",
    description: "Your files stay on-device at every tier. Always.",
  },
]

export default function PricingPage() {
  return (
    <div className="container-site flex flex-col gap-16 py-16 sm:py-24">
      <PageHeader
        eyebrow="Pricing"
        title="Start free. Scale when ready."
        description="One simple upgrade path — every plan includes the full private-by-design promise."
      />

      <PricingGrid />

      <Stagger className="grid gap-4 sm:grid-cols-3">
        {guarantees.map(({ icon: Icon, title, description }) => (
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

      <Reveal className="flex flex-col gap-6">
        <h2 className="text-center text-2xl font-semibold tracking-tight text-foreground">
          Billing questions, answered
        </h2>
        <div className="mx-auto w-full max-w-2xl">
          <Accordion type="single" collapsible>
            {faqs
              .filter((faq) => faq.id === "free-vs-pro" || faq.id === "cancel")
              .map((faq) => (
                <AccordionItem key={faq.id} value={faq.id}>
                  <AccordionTrigger>{faq.question}</AccordionTrigger>
                  <AccordionContent>{faq.answer}</AccordionContent>
                </AccordionItem>
              ))}
          </Accordion>
        </div>
      </Reveal>

      <Reveal className="flex justify-center">
        <Button variant="outline" size="lg" asChild>
          <Link href="/contact">
            Talk to a human about Team plans
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </Button>
      </Reveal>
    </div>
  )
}
