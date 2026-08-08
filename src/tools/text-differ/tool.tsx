"use client"

import { ToolPlaceholder } from "@/components/tool/tool-placeholder"
import { manifest } from "./manifest"

export default function TextDiffer({ className }: { className?: string }) {
  return <ToolPlaceholder manifest={manifest} className={className} />
}
