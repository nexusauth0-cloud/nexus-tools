import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { createMetadata } from "@/lib"
import {
  buildToolBreadcrumbJsonLd,
  buildToolJsonLd,
  buildToolMetadata,
  getRelatedTools,
} from "@/lib/platform"
import { ToolLayout } from "@/components/tool/tool-layout"
import { ToolWorkspace, type WorkspaceDecl } from "@/components/tool/workspace/tool-workspace"
import { getStaticTool, STATIC_TOOLS } from "@/lib/registry"
import { buildStaticToolManifest } from "@/features/tools/manifest"

interface StaticToolPageProps {
  params: Promise<{ id: string }>
}

export function generateStaticParams() {
  return STATIC_TOOLS.map((tool) => ({ id: tool.id }))
}

export async function generateMetadata({ params }: StaticToolPageProps): Promise<Metadata> {
  const { id } = await params
  const entry = getStaticTool(id)
  if (!entry) {
    return createMetadata({ title: "Tool not found", noindex: true, path: `/t/${id}` })
  }
  return buildToolMetadata(buildStaticToolManifest(entry.decl as never))
}

export default async function StaticToolPage({ params }: StaticToolPageProps) {
  const { id } = await params
  const entry = getStaticTool(id)

  if (!entry) notFound()

  const decl = entry.decl as unknown as WorkspaceDecl
  const manifest = buildStaticToolManifest(decl)
  const related = getRelatedTools(id)
  const switcherTools = STATIC_TOOLS.map((tool) => ({ id: tool.id, title: tool.title }))

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildToolJsonLd(manifest)) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildToolBreadcrumbJsonLd(manifest)) }}
      />
      <ToolLayout manifest={manifest} related={related}>
        <ToolWorkspace decl={decl} entryPoint={entry.entryPoint} switcherTools={switcherTools} />
      </ToolLayout>
    </>
  )
}
