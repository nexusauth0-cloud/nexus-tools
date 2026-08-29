import { Section, SectionHeading } from "@/components/design-system/section-heading"
import { PricingGrid } from "@/components/design-system/pricing-grid"

export function PricingPreviewSection() {
  return (
    <Section id="pricing">
      <div className="flex flex-col gap-10">
        <SectionHeading
          eyebrow="Pricing"
          title="Free, forever."
          description="All 55 tools run directly in your browser — no accounts, no uploads, no paid plans."
        />
        <PricingGrid />
      </div>
    </Section>
  )
}
