import { cn } from "@/lib"
import { PageHeader } from "./page-header"
import { Reveal } from "./motion"

export interface LegalSection {
  heading: string
  body: string[]
}

export function LegalPage({
  eyebrow,
  title,
  description,
  lastUpdated,
  sections,
}: {
  eyebrow: string
  title: string
  description: string
  lastUpdated: string
  sections: LegalSection[]
}) {
  return (
    <div className="container-site flex flex-col gap-12 py-16 sm:py-24">
      <PageHeader eyebrow={eyebrow} title={title} description={description} />
      <p className="-mt-6 text-xs text-muted-foreground">Last updated: {lastUpdated}</p>

      <div className="grid gap-12 lg:grid-cols-[220px_1fr] lg:gap-16">
        <Reveal className="hidden lg:block">
          <nav aria-label="On this page" className="sticky top-24 flex flex-col gap-1">
            {sections.map((section) => (
              <a
                key={section.heading}
                href={`#${section.heading.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
                className="rounded-lg px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-surface hover:text-foreground"
              >
                {section.heading}
              </a>
            ))}
          </nav>
        </Reveal>

        <div className="flex max-w-2xl flex-col gap-10">
          {sections.map((section) => (
            <Reveal key={section.heading}>
              <section
                id={section.heading.toLowerCase().replace(/[^a-z0-9]+/g, "-")}
                className="flex scroll-mt-24 flex-col gap-3"
              >
                <h2 className="text-xl font-semibold tracking-tight text-foreground">
                  {section.heading}
                </h2>
                {section.body.map((paragraph) => (
                  <p
                    key={paragraph}
                    className={cn("text-sm leading-relaxed text-muted-foreground")}
                  >
                    {paragraph}
                  </p>
                ))}
              </section>
            </Reveal>
          ))}
        </div>
      </div>
    </div>
  )
}
