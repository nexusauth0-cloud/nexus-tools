import { createMetadata } from "@/lib"
import { PageHeader } from "@/components/design-system/page-header"
import { ToolsDirectory } from "@/components/tools/tools-directory"

export const metadata = createMetadata({
  title: "All Tools",
  description:
    "Browse the complete NEXUS Tools catalog — 300+ fast, private utilities for image, text, code, media, and more.",
  path: "/tools",
})

export default function ToolsPage() {
  return (
    <div className="container-site flex flex-col gap-12 py-16 sm:py-24">
      <PageHeader
        eyebrow="Toolbox"
        title="Every tool, one catalog"
        description="Filter, search, and favorite your way through the full suite. Every tool runs locally — nothing is uploaded, ever."
      />
      <ToolsDirectory />
    </div>
  )
}
