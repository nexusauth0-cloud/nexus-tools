"use client"

import * as React from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { availableExports, useExport, type ExportFormat } from "@/lib/tool-engine"

interface ExportMenuProps {
  value: unknown
  filename: string
  className?: string
}

/**
 * Dropdown that exports the current result in any available format.
 * Selecting a format immediately triggers the download.
 */
export function ExportMenu({ value, filename, className }: ExportMenuProps) {
  const { download } = useExport()
  const formats = availableExports()

  return (
    <Select
      onValueChange={(format) => {
        const exporter = formats.find((item) => item.format === format)
        download(value, (exporter ? format : "txt") as ExportFormat, { filename })
      }}
    >
      <SelectTrigger className={className} aria-label="Export result">
        <SelectValue placeholder="Export…" />
      </SelectTrigger>
      <SelectContent>
        {formats.map((item) => (
          <SelectItem key={item.format} value={item.format}>
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
