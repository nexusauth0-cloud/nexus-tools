import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { createMetadata } from "@/lib"
import {
  buildToolBreadcrumbJsonLd,
  buildToolJsonLd,
  buildToolMetadata,
  getAllTools,
  getRelatedTools,
  getTool,
  getToolComponent,
} from "@/lib/platform"
import { ToolLayout } from "@/components/tool/tool-layout"

interface ToolPageProps {
  params: Promise<{ slug: string }>
}

export function generateStaticParams() {
  return getAllTools().map((tool) => ({ slug: tool.slug }))
}

export async function generateMetadata({ params }: ToolPageProps): Promise<Metadata> {
  const { slug } = await params
  const tool = getTool(slug)

  if (!tool) {
    return createMetadata({ title: "Tool not found", noindex: true, path: `/tools/${slug}` })
  }

  return buildToolMetadata(tool)
}

export default async function ToolPage({ params }: ToolPageProps) {
  const { slug } = await params
  const tool = getTool(slug)

  if (!tool) notFound()

  const Component = getToolComponent(slug)
  const related = getRelatedTools(slug)

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildToolJsonLd(tool)) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildToolBreadcrumbJsonLd(tool)) }}
      />
      <ToolLayout manifest={tool} related={related}>
        {/* eslint-disable-next-line react-hooks/static-components -- dynamic component from registry */}
        {Component ? <Component /> : null}
      </ToolLayout>
    </>
  )
}
