"use client"

import { Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useExport, type ExportFormat } from "@/lib/tool-engine"

interface DownloadButtonProps {
  value: unknown
  format?: ExportFormat
  filename: string
  label?: string
  className?: string
}

/** One-click download of a value in a fixed format. */
export function DownloadButton({
  value,
  format = "txt",
  filename,
  label = "Download",
  className,
}: DownloadButtonProps) {
  const { download } = useExport()
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className={className}
      onClick={() => download(value, format, { filename })}
      aria-label={`${label} ${filename}`}
    >
      <Download />
      {label}
    </Button>
  )
}
