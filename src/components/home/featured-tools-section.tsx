import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { getFeaturedTools } from "@/lib/platform"
import { Section, SectionHeading } from "@/components/design-system/section-heading"
import { ToolCard } from "@/components/design-system/tool-card"
import { Stagger } from "@/components/design-system/motion"
import { Button } from "@/components/ui/button"

export function FeaturedToolsSection() {
  return (
    <Section id="featured">
      <div className="flex flex-col gap-10">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeading
            align="left"
            eyebrow="Featured tools"
            title="Hand-picked to get things done"
            description="The tools our community reaches for most — fast, private, and impeccably designed."
          />
          <Button variant="outline" size="sm" asChild className="shrink-0">
            <Link href="/tools">
              See all tools
              <ArrowRight className="size-3.5" aria-hidden="true" />
            </Link>
          </Button>
        </div>

        <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {getFeaturedTools()
            .slice(0, 6)
            .map((tool) => (
              <ToolCard key={tool.slug} tool={tool} />
            ))}
        </Stagger>
      </div>
    </Section>
  )
}
