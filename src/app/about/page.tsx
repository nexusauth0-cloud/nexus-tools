import { createMetadata } from "@/lib"
import { Check } from "lucide-react"
import { PageHeader } from "@/components/design-system/page-header"
import { Reveal, Stagger, StaggerItem } from "@/components/design-system/motion"

export const metadata = createMetadata({
  title: "About",
  description:
    "The team and the values behind NEXUS Tools — a platform built on speed, privacy, and craftsmanship.",
  path: "/about",
})

const values = [
  {
    title: "Privacy is the product",
    body: "If a tool uploads your data, your data is the product. Every NEXUS tool processes locally, with zero server round-trips for your files.",
  },
  {
    title: "Craft over sprawl",
    body: "We'd rather ship 300 tools done beautifully than 3,000 done badly. Every utility earns its place with real design rigor.",
  },
  {
    title: "Speed is a feature",
    body: "No sign-up walls, no loading spinners, no 40-tab tabs. Tools open instantly and get out of your way.",
  },
]

const principles = [
  "On-device processing only",
  "No trackers, no analytics abuse",
  "Open about how things work",
  "Accessible by default",
  "Works offline as a PWA",
  "Honest free tier, forever",
]

export default function AboutPage() {
  return (
    <div className="container-site flex flex-col gap-16 py-16 sm:py-24">
      <PageHeader
        eyebrow="About"
        title={
          <>
            Built for people who <span className="text-gradient-gold">make things</span>
          </>
        }
        description="NEXUS Tools started with a simple frustration: the best online utilities were slow, ad-ridden, or quietly harvesting your files. We set out to build the opposite."
      />

      <Stagger className="grid gap-4 md:grid-cols-3">
        {values.map(({ title, body }) => (
          <StaggerItem key={title}>
            <div className="flex h-full flex-col gap-3 rounded-2xl border border-border bg-card p-6 shadow-card">
              <h2 className="text-base font-semibold text-foreground">{title}</h2>
              <p className="text-sm leading-relaxed text-muted-foreground">{body}</p>
            </div>
          </StaggerItem>
        ))}
      </Stagger>

      <Reveal>
        <div className="relative overflow-hidden rounded-3xl border border-border bg-card p-8 shadow-card sm:p-12">
          <div
            aria-hidden="true"
            className="absolute -inset-px -z-10 bg-[radial-gradient(60%_70%_at_50%_-20%,oklch(0.8_0.145_85/0.1),transparent_70%)]"
          />
          <div className="flex flex-col gap-6">
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">
              What we promise, in writing
            </h2>
            <ul className="grid gap-3 sm:grid-cols-2">
              {principles.map((principle) => (
                <li
                  key={principle}
                  className="flex items-center gap-3 rounded-xl border border-border bg-background/40 px-4 py-3 text-sm text-foreground"
                >
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <Check className="size-3 text-gold" aria-hidden="true" />
                  </span>
                  {principle}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Reveal>
    </div>
  )
}
