"use client"

import { useCallback } from "react"
import { downloadExport, formatExport, type ExportFormat, type ExportOptions } from "../export"
import { toast } from "sonner"

/**
 * Export helper. Wraps the export engine so tools call
 * `{ download }` and never touch Blob/anchor plumbing themselves.
 */
export function useExport() {
  const download = useCallback(
    (value: unknown, format: ExportFormat, options: ExportOptions & { filename?: string } = {}) => {
      const artifact = formatExport(format, value, options)
      downloadExport(artifact, options.filename ?? "export")
      toast.success(`Downloaded ${artifact.label} export.`)
    },
    []
  )

  return { download }
}
