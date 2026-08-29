import Link from "next/link"
import { CalendarClock, Flag, Users } from "lucide-react"
import type { ToolManifest } from "@/shared/manifest"
import { siteConfig } from "@/lib/site"
import { formatDate, formatUsage } from "@/lib/format"
import { cn } from "@/lib/utils"
import { getCategoryMeta } from "@/data/category-meta"
import { resolveIcon } from "@/lib/icons"
import { buildBreadcrumbItems } from "@/lib/platform/breadcrumbs"
import { Breadcrumbs } from "./breadcrumbs"
import { ShareButtons } from "./share-buttons"
import { ToolViewTracker } from "./tool-view-tracker"
import { ToolStatusBadge } from "@/components/design-system/tool-status-badge"
import { Rating } from "@/components/design-system/rating"
import { ToolCard } from "@/components/design-system/tool-card"
import { Stagger } from "@/components/design-system/motion"
import { Badge } from "@/components/ui/badge"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Separator } from "@/components/ui/separator"
import { SectionHeading } from "@/components/design-system/section-heading"

interface ToolLayoutProps {
  manifest: ToolManifest
  related: ToolManifest[]
  children: React.ReactNode
}

function reportHrefFor(title: string): string {
  const subject = encodeURIComponent(`Report an issue — ${title}`)
  const body = encodeURIComponent(`Tool: ${title}\n\nIssue:\n`)
  return `${siteConfig.supportEmail}?subject=${subject}&body=${body}`
}

/**
 * Reusable shell for every tool page. A tool provides only its manifest and
 * workspace component; this layout supplies breadcrumbs, hero, SEO metadata
 * hints, share/report actions, FAQ, "last updated", and related tools — so
 * nothing is duplicated across tools.
 */
export function ToolLayout({ manifest, related, children }: ToolLayoutProps) {
  const category = getCategoryMeta(manifest.categoryId)
  const Icon = resolveIcon(manifest.icon)
  const breadcrumbs = buildBreadcrumbItems(manifest)

  return (
    <div className="container-site flex flex-col gap-12 py-16 sm:py-24">
      <ToolViewTracker slug={manifest.slug} title={manifest.title} />
      <div className="flex flex-col gap-8">
        <Breadcrumbs items={breadcrumbs} />

        <header className="flex flex-col gap-6">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="flex flex-wrap items-center gap-4">
              <div
                className={cn(
                  "flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br shadow-sm",
                  manifest.gradient
                )}
              >
                {/* eslint-disable-next-line react-hooks/static-components -- data-driven icon registry (static module map) */}
                <Icon className={cn("size-6", category.tint)} aria-hidden="true" />
              </div>
              <div className="flex flex-col gap-1.5">
                <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                  {manifest.title}
                </h1>
                <div className="flex flex-wrap items-center gap-2">
                  <ToolStatusBadge tier={manifest.tier} />
                  {manifest.isNew && (
                    <Badge variant="violet" className="uppercase">
                      New
                    </Badge>
                  )}
                  <Link
                    href={`/categories/${manifest.categoryId}`}
                    className="text-sm text-muted-foreground transition-colors hover:text-gold"
                  >
                    {category.name}
                  </Link>
                </div>
              </div>
            </div>

            <ShareButtons title={manifest.title} path={`/tools/${manifest.slug}`} />
          </div>

          <p className="max-w-2xl text-lg leading-relaxed text-muted-foreground">
            {manifest.description}
          </p>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-muted-foreground">
            {manifest.usage > 0 && (
              <span className="inline-flex items-center gap-1.5">
                <Users className="size-4 text-gold" aria-hidden="true" />
                {formatUsage(manifest.usage)} runs / month
              </span>
            )}
            {manifest.rating > 0 && <Rating value={manifest.rating} />}
            {manifest.supportedBrowsers && manifest.supportedBrowsers.length > 0 && (
              <span className="inline-flex items-center gap-1.5">
                Runs in {manifest.supportedBrowsers.join(", ")}
              </span>
            )}
          </div>
        </header>
      </div>

      <main>{children}</main>

      <div className="flex flex-wrap items-center justify-between gap-4 text-xs text-muted-foreground">
        <time dateTime={manifest.updatedAt} className="inline-flex items-center gap-1.5">
          <CalendarClock className="size-3.5" aria-hidden="true" />
          Last updated {formatDate(manifest.updatedAt)}
        </time>
        <a
          href={reportHrefFor(manifest.title)}
          className="inline-flex items-center gap-1.5 rounded-sm transition-colors hover:text-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Flag className="size-3.5" aria-hidden="true" />
          Report an issue
        </a>
      </div>

      {manifest.faqs && manifest.faqs.length > 0 && (
        <>
          <Separator />
          <section aria-labelledby="tool-faq-heading" className="flex flex-col gap-6">
            <SectionHeading eyebrow="FAQ" title="Frequently asked" align="left" />
            <Accordion type="single" collapsible>
              {manifest.faqs.map((faq) => (
                <AccordionItem key={faq.question} value={faq.question}>
                  <AccordionTrigger>{faq.question}</AccordionTrigger>
                  <AccordionContent>{faq.answer}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </section>
        </>
      )}

      {related.length > 0 && (
        <>
          <Separator />
          <section aria-labelledby="related-tools-heading" className="flex flex-col gap-8">
            <div className="flex flex-col gap-1.5">
              <h2
                id="related-tools-heading"
                className="text-2xl font-semibold tracking-tight text-foreground"
              >
                More in {category.name}
              </h2>
              <p className="text-sm text-muted-foreground">Live tools you can use right now.</p>
            </div>
            <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((tool) => (
                <ToolCard key={tool.slug} tool={tool} />
              ))}
            </Stagger>
          </section>
        </>
      )}
    </div>
  )
}
