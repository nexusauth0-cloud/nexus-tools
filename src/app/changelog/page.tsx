import { createMetadata } from "@/lib"
import { PageHeader } from "@/components/design-system/page-header"
import { Reveal } from "@/components/design-system/motion"
import { changelog } from "@/data/changelog"

/**
 * Changelog for NEXUS Tools. Entries live in src/data/changelog.ts
 * (admin-authored content), newest on top.
 */

export const metadata = createMetadata({
  title: "Changelog",
  description: "What's new in NEXUS Tools — releases, fixes, and improvements.",
  path: "/changelog",
})

export default function ChangelogPage() {
  return (
    <div className="container-site flex flex-col gap-16 py-16 sm:py-24">
      <PageHeader
        eyebrow="Changelog"
        title="What's new"
        description="Releases, fixes, and improvements — newest on top."
      />
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-10">
        {changelog.map((entry) => (
          <Reveal key={entry.version} className="flex flex-col gap-3">
            <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
              <h2 className="font-display text-2xl font-semibold text-foreground">
                v{entry.version}
              </h2>
              <time className="text-sm text-muted-foreground">{entry.date}</time>
            </div>
            <p className="text-muted-foreground">{entry.summary}</p>
            <ul className="list-inside list-disc space-y-1.5 text-sm text-foreground">
              {entry.changes.map((change) => (
                <li key={change}>{change}</li>
              ))}
            </ul>
          </Reveal>
        ))}
      </div>
    </div>
  )
}