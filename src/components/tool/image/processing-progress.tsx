"use client"

import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface ProcessingProgressProps {
  label: string
  className?: string
}

/** Indeterminate progress note shown while an image is being processed. */
export function ProcessingProgress({ label, className }: ProcessingProgressProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn("flex items-center gap-2 text-sm", className)}
    >
      <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
      <span className="text-muted-foreground">{label}</span>
    </div>
  )
}
