"use client"

import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { useRecentsStore } from "@/store/recents-store"
import { useFavoritesStore } from "@/store/favorites-store"
import { getAllTools } from "@/lib/platform"
import { Section, SectionHeading } from "@/components/design-system/section-heading"
import { ToolCard } from "@/components/design-system/tool-card"
import { Stagger } from "@/components/design-system/motion"
import { Button } from "@/components/ui/button"

const MAX_RECENTS_ON_HOME = 4
const MAX_FAVORITES_ON_HOME = 6

export function PersonalizedSection() {
  const recents = useRecentsStore((state) => state.recents)
  const favorites = useFavoritesStore((state) => state.favorites)

  const toolsBySlug = new Map(getAllTools().map((t) => [t.slug, t]))

  const recentTools = recents
    .slice(0, MAX_RECENTS_ON_HOME)
    .map((entry) => toolsBySlug.get(entry.slug))
    .filter(Boolean) as import("@/shared/manifest").ToolManifest[]

  const favoriteTools = favorites
    .slice(0, MAX_FAVORITES_ON_HOME)
    .map((slug) => toolsBySlug.get(slug))
    .filter(Boolean) as import("@/shared/manifest").ToolManifest[]

  if (recentTools.length === 0 && favoriteTools.length === 0) return null

  return (
    <>
      {recentTools.length > 0 && (
        <Section id="recent">
          <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
              <SectionHeading
                align="left"
                eyebrow="Recently used"
                title="Pick up where you left off"
                description="Your most recently visited tools, ready when you are."
              />
              <Button variant="outline" size="sm" asChild className="shrink-0">
                <Link href="/tools">
                  Browse all tools
                  <ArrowRight className="size-3.5" aria-hidden="true" />
                </Link>
              </Button>
            </div>

            <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {recentTools.map((tool) => (
                <ToolCard key={tool.slug} tool={tool} />
              ))}
            </Stagger>
          </div>
        </Section>
      )}

      {favoriteTools.length > 0 && (
        <Section id="favorites">
          <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
              <SectionHeading
                align="left"
                eyebrow="Your favorites"
                title="Tools you love"
                description="The tools you have saved — always within reach."
              />
              <Button variant="outline" size="sm" asChild className="shrink-0">
                <Link href="/tools">
                  See all tools
                  <ArrowRight className="size-3.5" aria-hidden="true" />
                </Link>
              </Button>
            </div>

            <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {favoriteTools.map((tool) => (
                <ToolCard key={tool.slug} tool={tool} />
              ))}
            </Stagger>
          </div>
        </Section>
      )}
    </>
  )
}
