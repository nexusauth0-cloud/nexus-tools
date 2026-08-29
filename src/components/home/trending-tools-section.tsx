import Link from "next/link"
import { ArrowRight, Flame } from "lucide-react"
import { getTrendingTools } from "@/lib/platform"
import { SectionHeading } from "@/components/design-system/section-heading"
import { ToolCard } from "@/components/design-system/tool-card"
import { Stagger, Reveal } from "@/components/design-system/motion"

export function TrendingToolsSection() {
  return (
    <section className="relative overflow-hidden py-16 sm:py-24">
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 -z-10 h-full bg-[radial-gradient(50%_40%_at_50%_0%,oklch(0.8_0.145_85/0.06),transparent_70%)]"
      />
      <div className="container-site flex flex-col gap-10">
        <Reveal className="flex items-center justify-center gap-3">
          <SectionHeading
            eyebrow={
              <span className="inline-flex items-center gap-1.5">
                <Flame className="size-4" aria-hidden="true" />
                Popular right now
              </span>
            }
            title="Tools people reach for most"
            description="A hand-picked selection of the catalog — every one live, private, and free. No inflated numbers, just the essentials."
          />
        </Reveal>

        <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {getTrendingTools().map((tool) => (
            <ToolCard key={tool.slug} tool={tool} />
          ))}
        </Stagger>

        <Reveal className="flex justify-center">
          <Link
            href="/tools"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-gold transition-colors hover:underline"
          >
            See all 55 tools
            <ArrowRight className="size-3.5" aria-hidden="true" />
          </Link>
        </Reveal>
      </div>
    </section>
  )
}
