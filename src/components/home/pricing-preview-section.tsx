import { Section, SectionHeading } from "@/components/design-system/section-heading"
import { PricingGrid } from "@/components/design-system/pricing-grid"

export function PricingPreviewSection() {
  return (
    <Section id="pricing">
      <div className="flex flex-col gap-10">
        <SectionHeading
          eyebrow="Pricing"
          title="Simple pricing, no surprises"
          description="Start free, upgrade when your workflow demands more firepower."
        />
        <PricingGrid />
      </div>
    </Section>
  )
}
