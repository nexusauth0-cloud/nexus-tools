"use client"

import Link from "next/link"
import { ArrowRight, FlaskConical } from "lucide-react"
import type { ToolManifest } from "@/shared/manifest"
import { ToolFavoriteButton } from "@/components/tools/tool-favorite-button"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib"

/**
 * Default tool workspace shown until a tool ships real logic.
 * Each tool folder owns its component; the placeholder is the shared
 * scaffold they all start from.
 */
export function ToolPlaceholder({
  manifest,
  className,
}: {
  manifest: ToolManifest
  className?: string
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-3xl border border-border bg-card p-8 shadow-card sm:p-12",
        className
      )}
    >
      <div
        aria-hidden="true"
        className="absolute -inset-px -z-10 bg-[radial-gradient(60%_70%_at_50%_-20%,oklch(0.8_0.145_85/0.1),transparent_70%)]"
      />
      <div className="flex flex-col items-center gap-6 text-center">
        <div className="flex size-16 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10">
          <FlaskConical className="size-7 text-gold" aria-hidden="true" />
        </div>
        <div className="flex max-w-xl flex-col gap-2">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">
            In the lab, launching soon
          </h2>
          <p className="text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base">
            {manifest.title} is fully cataloged and on the release board. Follow its progress — and
            favorite it below — so you&apos;re first to know when it ships.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <ToolFavoriteButton tool={manifest} size="lg" />
          <Button variant="outline" size="lg" asChild>
            <Link href="/tools">
              Explore other tools
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
