import { faqs } from "@/data/faqs"
import { Section, SectionHeading } from "@/components/design-system/section-heading"
import { Reveal } from "@/components/design-system/motion"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

export function FaqSection() {
  return (
    <Section id="faq">
      <div className="flex flex-col gap-12 lg:flex-row lg:gap-20">
        <Reveal className="lg:w-2/5">
          <SectionHeading
            align="left"
            eyebrow="FAQ"
            title="Answers before you ask"
            description="Still curious? Reach out any time — a human reads every message."
          />
        </Reveal>

        <Reveal delay={0.1} className="lg:w-3/5">
          <Accordion type="single" collapsible defaultValue={faqs[0]?.id}>
            {faqs.map((faq) => (
              <AccordionItem key={faq.id} value={faq.id}>
                <AccordionTrigger>{faq.question}</AccordionTrigger>
                <AccordionContent>{faq.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Reveal>
      </div>
    </Section>
  )
}
