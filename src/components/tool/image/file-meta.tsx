"use client"

import { FileText } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatFileSize, type ImageFormat } from "@/lib/image"

interface FileMetaProps {
  file: File
  /** Format detected from the file's real bytes (never the extension). */
  format?: ImageFormat | null
  width?: number
  height?: number
  className?: string
}

/** Compact one-line facts about a selected image file. */
export function FileMeta({ file, format, width, height, className }: FileMetaProps) {
  const facts = [
    format ? format.toUpperCase() : null,
    width && height ? `${width} × ${height}px` : null,
    formatFileSize(file.size),
  ].filter(Boolean)
  return (
    <p className={cn("flex items-center gap-1.5 text-xs text-muted-foreground", className)}>
      <FileText className="h-3.5 w-3.5 shrink-0" />
      <span className="max-w-[220px] truncate font-medium text-foreground">{file.name}</span>
      <span aria-hidden>·</span>
      {facts.join(" · ")}
    </p>
  )
}
