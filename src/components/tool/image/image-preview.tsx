"use client"

import Image from "next/image"
import { cn } from "@/lib/utils"
import { useObjectUrl } from "@/lib/image/object-url"

interface ImagePreviewProps {
  file: File
  alt?: string
  className?: string
}

/** Inline preview of a user-selected image, safely managing the object URL. */
export function ImagePreview({ file, alt, className }: ImagePreviewProps) {
  const url = useObjectUrl(file)
  if (!url) return null
  return (
    <div className={cn("overflow-hidden rounded-xl border border-border bg-surface/40", className)}>
      <Image
        src={url}
        alt={alt ?? file.name}
        width={640}
        height={360}
        className="h-auto w-full object-contain"
        unoptimized
      />
    </div>
  )
}
