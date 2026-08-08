"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ErrorAlert } from "@/components/tool/outputs/error-alert"
import { ResetButton } from "@/components/tool/outputs/reset-button"
import { FileDrop } from "@/components/tool/image/file-drop"
import { FileMeta } from "@/components/tool/image/file-meta"
import { ProcessingProgress } from "@/components/tool/image/processing-progress"
import { useTool } from "@/lib/tool-engine"
import {
  formatFileSize,
  readImageDimensions,
  validateImageBytes,
  type ImageFormat,
} from "@/lib/image"
import { imageMetadataEngine } from "./engine"
import { manifest } from "./manifest"

interface SourceImage {
  file: File
  bytes: Uint8Array
  format: ImageFormat
  width: number
  height: number
}

export default function ImageMetadata() {
  const [source, setSource] = useState<SourceImage | null>(null)
  const [busy, setBusy] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)

  const { status, result, error, run, reset } = useTool(imageMetadataEngine)

  const handleSelect = async (file: File) => {
    setLocalError(null)
    try {
      const bytes = new Uint8Array(await file.arrayBuffer())
      const validation = validateImageBytes(bytes)
      if (!validation.ok) {
        setLocalError(validation.message)
        return
      }
      const dims = readImageDimensions(bytes)
      if (!dims) {
        setLocalError("The image dimensions couldn't be read.")
        return
      }
      setSource({ file, bytes, format: dims.format, width: dims.width, height: dims.height })
    } catch {
      setLocalError("This file couldn't be read.")
    }
  }

  const handleClear = () => {
    setSource(null)
    reset()
    setLocalError(null)
  }

  const handleInspect = async () => {
    if (!source) return
    setLocalError(null)
    setBusy(true)
    try {
      await run({ bytes: source.bytes, bytesLength: source.bytes.length })
    } catch (caught) {
      setLocalError(caught instanceof Error ? caught.message : "Inspection failed.")
    } finally {
      setBusy(false)
    }
  }

  const handleReset = () => {
    handleClear()
  }

  const busyNow = busy || status === "processing" || status === "validating"
  const errorId = `${manifest.slug}-error`
  const meta = result?.output

  const rows: Array<{ label: string; value: string }> = meta
    ? [
        { label: "Format", value: meta.format.toUpperCase() },
        {
          label: "Dimensions",
          value: meta.width && meta.height ? `${meta.width} × ${meta.height}px` : "Unknown",
        },
        { label: "File size", value: formatFileSize(meta.bytes) },
        { label: "EXIF present", value: meta.exif ? "Yes" : "No" },
        { label: "GPS data", value: meta.hasGps ? "Present" : "None" },
        ...(meta.make ? [{ label: "Camera make", value: meta.make }] : []),
        ...(meta.model ? [{ label: "Camera model", value: meta.model }] : []),
        ...(meta.software ? [{ label: "Software", value: meta.software }] : []),
        ...(meta.imageDescription
          ? [{ label: "Image description", value: meta.imageDescription }]
          : []),
        ...(meta.dateTime ? [{ label: "Date/time", value: meta.dateTime }] : []),
        ...(meta.dateTimeOriginal
          ? [{ label: "Original date/time", value: meta.dateTimeOriginal }]
          : []),
        ...(meta.orientation ? [{ label: "Orientation", value: meta.orientation.label }] : []),
        ...(meta.exposure ? [{ label: "Exposure", value: `${meta.exposure}s` }] : []),
        ...(meta.fNumber ? [{ label: "Aperture", value: `f/${meta.fNumber}` }] : []),
        ...(meta.iso ? [{ label: "ISO", value: String(meta.iso) }] : []),
        ...(meta.focalLength ? [{ label: "Focal length", value: `${meta.focalLength}mm` }] : []),
        ...(meta.focalLength35mm
          ? [{ label: "Focal length (35mm)", value: `${meta.focalLength35mm}mm` }]
          : []),
        ...(meta.flash !== undefined
          ? [{ label: "Flash used", value: meta.flash ? "Yes" : "No" }]
          : []),
        ...(meta.lensMake ? [{ label: "Lens make", value: meta.lensMake }] : []),
        ...(meta.lensModel ? [{ label: "Lens model", value: meta.lensModel }] : []),
      ]
    : []

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="flex flex-col gap-5">
        <FileDrop
          label="Drop a JPEG, PNG or WebP image to inspect"
          onSelect={(file) => void handleSelect(file)}
          onClear={source ? handleClear : undefined}
          disabled={busyNow}
        />
        {source ? (
          <>
            <FileMeta
              file={source.file}
              format={source.format}
              width={source.width}
              height={source.height}
            />

            <div className="flex items-center gap-3">
              <Button onClick={() => void handleInspect()} disabled={busyNow || !source}>
                {busyNow ? "Inspecting…" : "Read metadata"}
              </Button>
              <ResetButton onClick={handleReset} disabled={busyNow || (!source && !result)} />
            </div>

            {busyNow ? <ProcessingProgress label="Reading bytes from the file…" /> : null}

            <div id={errorId}>
              <ErrorAlert error={error} />
            </div>
            {localError ? (
              <p role="alert" className="text-sm text-destructive">
                {localError}
              </p>
            ) : null}
          </>
        ) : null}
      </div>

      {meta ? (
        <div className="flex flex-col gap-3 text-sm">
          <h2 className="font-semibold text-foreground">
            {meta.entryCount} metadata field{meta.entryCount === 1 ? "" : "s"} found
          </h2>
          {rows.length ? (
            <dl className="divide-y divide-border rounded-xl border border-border bg-surface/40">
              {rows.map((row) => (
                <div
                  key={row.label}
                  className="grid grid-cols-[minmax(0,11rem)_1fr] gap-4 px-4 py-2.5"
                >
                  <dt className="text-muted-foreground">{row.label}</dt>
                  <dd className="font-medium text-foreground">{row.value}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="text-muted-foreground">
              This file doesn&apos;t contain any EXIF metadata to show. Camera apps on mobile often
              strip it automatically.
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            Metadata is read directly from the file&apos;s bytes in your browser — nothing is
            uploaded. GPS presence is noted, but exact coordinates aren&apos;t displayed or stored
            to protect your privacy.
          </p>
        </div>
      ) : null}
    </div>
  )
}
