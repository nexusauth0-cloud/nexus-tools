import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { createMetadata } from "@/lib"
import {
  buildCategoryMetadata,
  getCategories,
  getCategory,
  getToolsByCategory,
} from "@/lib/platform"
import { resolveIcon } from "@/lib/icons"
import { PageHeader } from "@/components/design-system/page-header"
import { ToolCard } from "@/components/design-system/tool-card"
import { Stagger } from "@/components/design-system/motion"
import { EmptyState } from "@/components/design-system/empty-state"
import { Button } from "@/components/ui/button"

interface CategoryPageProps {
  params: Promise<{ slug: string }>
}

export function generateStaticParams() {
  return getCategories().map((category) => ({ slug: category.id }))
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params
  const category = getCategory(slug)

  if (!category) {
    return createMetadata({
      title: "Category not found",
      noindex: true,
      path: `/categories/${slug}`,
    })
  }

  return buildCategoryMetadata(slug)
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params
  const category = getCategory(slug)

  if (!category) notFound()

  const Icon = resolveIcon(category.icon)
  const tools = getToolsByCategory(slug)

  return (
    <div className="container-site flex flex-col gap-12 py-16 sm:py-24">
      <Button variant="ghost" size="sm" className="w-fit -mb-6" asChild>
        <Link href="/categories">
          <ArrowLeft className="size-4" aria-hidden="true" />
          All categories
        </Link>
      </Button>

      <PageHeader
        eyebrow={
          <span className="inline-flex items-center gap-2">
            {/* eslint-disable-next-line react-hooks/static-components -- data-driven icon registry (static module map) */}
            <Icon className="size-4" aria-hidden="true" />
            Category
          </span>
        }
        title={category.name}
        description={category.description}
      />

      {tools.length === 0 ? (
        <EmptyState
          icon={Icon}
          title={`${category.name} are being crafted`}
          description="This category is live in the catalog but its tools launch in the next milestone. Browse everything else in the meantime."
          action={{ label: "Browse all tools", href: "/tools" }}
        />
      ) : (
        <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tools.map((tool) => (
            <ToolCard key={tool.slug} tool={tool} />
          ))}
        </Stagger>
      )}
    </div>
  )
}
