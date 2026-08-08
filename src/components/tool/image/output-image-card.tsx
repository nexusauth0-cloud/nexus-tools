"use client"

import { useEffect, useState } from "react"
import { Download } from "lucide-react"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { formatFileSize } from "@/lib/image"
import { Button } from "@/components/ui/button"

interface OutputImageCardProps {
  /** Encoded result blob. */
  blob: Blob
  filename: string
  /** Extra facts line, e.g. "JPEG · 1280 × 720px". */
  meta?: string
  className?: string
}

/**
 * Result presentation for image tools: preview, measured size, download.
 * The object URL is created on mount and always revoked on unmount.
 */
export function OutputImageCard({ blob, filename, meta, className }: OutputImageCardProps) {
  const [prevBlob, setPrevBlob] = useState<Blob | null>(null)
  const [url, setUrl] = useState<string | null>(() => (blob ? URL.createObjectURL(blob) : null))

  if (blob !== prevBlob) {
    const next = URL.createObjectURL(blob)
    if (url) URL.revokeObjectURL(url)
    setPrevBlob(blob)
    setUrl(next)
  }

  useEffect(() => {
    return () => {
      if (url) URL.revokeObjectURL(url)
    }
  }, [url])

  return (
    <div className={cn("overflow-hidden rounded-xl border border-border bg-surface/40", className)}>
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div className="min-w-0">
          <p className="truncate text-xs font-medium">{filename}</p>
          <p className="text-xs text-muted-foreground">
            {formatFileSize(blob.size)}
            {meta ? ` · ${meta}` : ""}
          </p>
        </div>
        <Button
          asChild
          variant="outline"
          size="sm"
          disabled={!url}
          aria-label={`Download ${filename}`}
        >
          <a href={url ?? undefined} download={filename}>
            <Download />
            Download
          </a>
        </Button>
      </div>
      {url ? (
        <Image
          src={url}
          alt={filename}
          width={640}
          height={360}
          unoptimized
          className="h-auto w-full object-contain"
        />
      ) : null}
    </div>
  )
}
