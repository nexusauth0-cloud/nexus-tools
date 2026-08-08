"use client"

import { useCallback, useRef, useState } from "react"
import { ImageUp, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { MAX_IMAGE_FILE_BYTES } from "@/lib/image"

interface FileDropProps {
  /** Accessible name for the control. */
  label: string
  onSelect: (file: File) => void
  onClear?: () => void
  /** Inline error text shown under the drop area. */
  error?: string | null
  disabled?: boolean
  className?: string
}

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"])

/**
 * Drag-and-drop + browse control for single image inputs. Rejects files
 * above the global 20 MB cap before they reach the tool; the real format
 * check happens by reading magic bytes, never the extension.
 */
export function FileDrop({ label, onSelect, onClear, error, disabled, className }: FileDropProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)

  const describe = useCallback((file: File): string | null => {
    if (!ALLOWED_TYPES.has(file.type)) {
      return "Only JPEG, PNG or WebP images are supported."
    }
    if (file.size > MAX_IMAGE_FILE_BYTES) {
      const mb = Math.round(MAX_IMAGE_FILE_BYTES / (1024 * 1024))
      return `This file is larger than the ${mb} MB limit.`
    }
    return null
  }, [])

  const handleFile = useCallback(
    (file: File | undefined) => {
      if (!file) return
      const message = describe(file)
      if (message) {
        setLocalError(message)
        return
      }
      setLocalError(null)
      onSelect(file)
    },
    [describe, onSelect]
  )

  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault()
      setDragging(false)
      handleFile(event.dataTransfer.files?.[0])
    },
    [handleFile]
  )

  const shownError = error ?? localError

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div
        role="button"
        tabIndex={0}
        aria-label={label}
        aria-describedby={shownError ? "file-drop-error" : undefined}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault()
            inputRef.current?.click()
          }
        }}
        onDragOver={(event) => {
          event.preventDefault()
          if (!disabled) setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          if (!disabled) handleDrop(event)
        }}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring",
          dragging
            ? "border-primary bg-primary/5"
            : "border-border bg-surface/40 hover:border-primary/60 hover:bg-surface/70",
          disabled && "pointer-events-none opacity-60"
        )}
      >
        <ImageUp className="h-6 w-6 text-muted-foreground" />
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">
          Drag &amp; drop, or click to browse · max 20 MB
        </p>
        <input
          ref={inputRef}
          type="file"
          accept={Array.from(ALLOWED_TYPES).join(",")}
          className="sr-only"
          disabled={disabled}
          onChange={(event) => {
            handleFile(event.target.files?.[0])
            event.target.value = ""
          }}
        />
      </div>
      {onClear && (
        <div>
          <button
            type="button"
            onClick={onClear}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground underline-offset-2 hover:underline"
          >
            <X className="h-3.5 w-3.5" />
            Clear file
          </button>
        </div>
      )}
      {shownError ? (
        <p id="file-drop-error" role="alert" className="text-xs text-destructive">
          {shownError}
        </p>
      ) : null}
    </div>
  )
}
