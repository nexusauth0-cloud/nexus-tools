"use client"

import { ToolPlaceholder } from "@/components/tool/tool-placeholder"
import { manifest } from "./manifest"

export default function DeadlineCalculator({ className }: { className?: string }) {
  return <ToolPlaceholder manifest={manifest} className={className} />
}
