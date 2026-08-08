"use client"

import { ToolPlaceholder } from "@/components/tool/tool-placeholder"
import { manifest } from "./manifest"

export default function CaseConverter({ className }: { className?: string }) {
  return <ToolPlaceholder manifest={manifest} className={className} />
}
