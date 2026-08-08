import Link from "next/link"
import { ArrowRight, Bot, FileText, ChartLine, Sparkles, Wand } from "lucide-react"
import { cn } from "@/lib"
import { SectionHeading } from "@/components/design-system/section-heading"
import { Reveal } from "@/components/design-system/motion"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

const spotlightFeatures = [
  {
    icon: FileText,
    title: "Summarize anything",
    description: "Condense articles, docs, and transcripts into crisp key points.",
  },
  {
    icon: Wand,
    title: "Rewrite on demand",
    description: "Rephrase with a chosen tone — without the platform lock-in.",
  },
  {
    icon: ChartLine,
    title: "Insights, not noise",
    description: "Spot patterns in text and data you'd miss by eye.",
  },
]

export function AiSpotlightSection() {
  return (
    <section id="ai" className="py-16 sm:py-24">
      <div className="container-site">
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl border border-violet/25 bg-card shadow-glow-violet">
            <div
              aria-hidden="true"
              className="absolute -inset-px -z-10 bg-[radial-gradient(70%_90%_at_80%_-10%,oklch(0.66_0.19_300/0.22),transparent_60%),radial-gradient(50%_60%_at_10%_110%,oklch(0.8_0.145_85/0.12),transparent_60%)]"
            />

            <div className="flex flex-col gap-10 p-8 sm:p-12 lg:flex-row lg:items-center lg:gap-16 lg:p-16">
              <div className="flex flex-1 flex-col gap-6">
                <div className="flex items-center gap-2">
                  <Badge variant="violet" className="gap-1.5">
                    <Bot className="size-3" aria-hidden="true" />
                    Coming soon
                  </Badge>
                  <Badge variant="outline">AI Spotlight</Badge>
                </div>

                <SectionHeading
                  align="left"
                  title="NEXUS AI — intelligence baked into every tool"
                  description="Purpose-built models that summarize, rewrite, and analyze your content. Private by design: processing stays on your device."
                />

                <ul className="flex flex-col gap-4">
                  {spotlightFeatures.map(({ icon: Icon, title, description }) => (
                    <li key={title} className="flex items-start gap-3">
                      <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg border border-violet/25 bg-violet/10">
                        <Icon className="size-4 text-violet" aria-hidden="true" />
                      </span>
                      <span className="flex flex-col gap-0.5">
                        <span className="text-sm font-medium text-foreground">{title}</span>
                        <span className="text-sm text-muted-foreground">{description}</span>
                      </span>
                    </li>
                  ))}
                </ul>

                <div className="flex flex-wrap items-center gap-3">
                  <Button size="lg" asChild>
                    <Link href="/pricing">
                      Get early access
                      <ArrowRight className="size-4" aria-hidden="true" />
                    </Link>
                  </Button>
                  <Button size="lg" variant="outline" asChild>
                    <Link href="/blog/online-tools-privacy-guide">Read the engineering notes</Link>
                  </Button>
                </div>
              </div>

              <div className="hidden shrink-0 lg:block">
                <div className={cn("relative flex size-[340px] items-center justify-center")}>
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 rounded-full bg-[radial-gradient(60%_60%_at_50%_50%,oklch(0.66_0.19_300/0.25),transparent_70%)] blur-2xl"
                  />
                  <div className="relative flex size-56 items-center justify-center rounded-3xl border border-violet/30 bg-card/90 backdrop-blur">
                    <Sparkles
                      className="size-20 text-violet"
                      strokeWidth={1.4}
                      aria-hidden="true"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
