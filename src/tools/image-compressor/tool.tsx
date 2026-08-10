"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Segmented, type SegmentedOption } from "@/components/tool/inputs/segmented"
import { ErrorAlert } from "@/components/tool/outputs/error-alert"
import { ResetButton } from "@/components/tool/outputs/reset-button"
import { FileDrop } from "@/components/tool/image/file-drop"
import { FileMeta } from "@/components/tool/image/file-meta"
import { ImagePreview } from "@/components/tool/image/image-preview"
import { ProcessingProgress } from "@/components/tool/image/processing-progress"
import { OutputImageCard } from "@/components/tool/image/output-image-card"
import { QualitySlider } from "@/components/tool/image/quality-slider"
import { useTool } from "@/lib/tool-engine"
import {
  IMAGE_FORMAT_INFO,
  formatFileSize,
  readImageDimensions,
  validateImageBytes,
  type ImageFormat,
} from "@/lib/image"
import { decodeImageFile, encodeCanvas, createCanvas } from "@/lib/image/browser"
import { imageCompressorEngine, COMPRESS_FORMATS, type CompressFormat } from "./engine"
import { manifest } from "./manifest"

const FORMAT_OPTIONS: SegmentedOption<CompressFormat>[] = COMPRESS_FORMATS.map((format) => ({
  value: format,
  label: IMAGE_FORMAT_INFO[format].label,
}))

interface SourceImage {
  file: File
  bytes: Uint8Array
  format: ImageFormat
  width: number
  height: number
}

interface OutputImage {
  blob: Blob
  filename: string
}

export default function ImageCompressor() {
  const [source, setSource] = useState<SourceImage | null>(null)
  const [format, setFormat] = useState<CompressFormat>("webp")
  const [quality, setQuality] = useState(80)
  const [busy, setBusy] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)
  const [output, setOutput] = useState<OutputImage | null>(null)

  const { status, result, error, run, reset } = useTool(imageCompressorEngine)

  const handleSelect = async (file: File) => {
    setLocalError(null)
    setOutput(null)
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
      // Default the output format to the source format (only lossy keeps quality control).
      setFormat(dims.format === "png" ? "png" : "webp")
    } catch {
      setLocalError("This file couldn't be read.")
    }
  }

  const handleClear = () => {
    setSource(null)
    setOutput(null)
    reset()
    setLocalError(null)
  }

  const handleCompress = async () => {
    if (!source) return
    setLocalError(null)
    setBusy(true)
    let decoded: Awaited<ReturnType<typeof decodeImageFile>> | null = null
    try {
      decoded = await decodeImageFile(source.file)
      const canvas = createCanvas(source.width, source.height)
      const context = canvas.getContext("2d") as CanvasRenderingContext2D | null
      if (!context) throw new Error("Canvas isn't available in this browser.")
      context.imageSmoothingQuality = "high"
      context.drawImage(decoded.source, 0, 0, source.width, source.height)
      const blob = await encodeCanvas(canvas, format, quality)

      await run({
        bytes: source.bytes,
        bytesLength: source.bytes.length,
        format,
        quality,
        outputBytes: blob.size,
        outputWidth: source.width,
        outputHeight: source.height,
      })

      const base = source.file.name.replace(/\.[^.]+$/, "")
      setOutput({
        blob,
        filename: `${base}-compressed.${IMAGE_FORMAT_INFO[format].extension}`,
      })
    } catch (caught) {
      setLocalError(caught instanceof Error ? caught.message : "Compression failed.")
    } finally {
      decoded?.close()
      setBusy(false)
    }
  }

  const handleReset = () => {
    handleClear()
    setFormat("webp")
    setQuality(80)
  }

  const busyNow = busy || status === "processing" || status === "validating"
  const errorId = `${manifest.slug}-error`
  const summary = result?.output

  const savings = summary ? (summary.grew ? null : summary.bytesReduced) : null

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="flex flex-col gap-5">
        <FileDrop
          label="Drop an image to compress"
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
            <ImagePreview file={source.file} alt={`Original ${source.file.name}`} />

            <Segmented
              label="Output format"
              options={FORMAT_OPTIONS}
              value={format}
              onChange={setFormat}
            />
            {format === "png" ? (
              <p className="text-xs text-muted-foreground">
                PNG is lossless — re-encoding it won&apos;t reduce quality, but compression only
                helps with lossy formats (JPEG, WebP).
              </p>
            ) : (
              <QualitySlider
                label={`${IMAGE_FORMAT_INFO[format].label} quality`}
                value={quality}
                onChange={setQuality}
              />
            )}

            <div className="flex items-center gap-3">
              <Button onClick={() => void handleCompress()} disabled={busyNow || !source}>
                {busyNow ? "Compressing…" : "Compress image"}
              </Button>
              <ResetButton onClick={handleReset} disabled={busyNow || (!source && !result)} />
            </div>

            {busyNow ? <ProcessingProgress label="Re-encoding pixels in your browser…" /> : null}

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

      {output && summary ? (
        <div className="flex flex-col gap-3">
          <OutputImageCard blob={output.blob} filename={output.filename} />
          {summary.grew ? (
            <p className="text-sm text-amber-600 dark:text-amber-500">
              This re-encode is actually larger than the original (
              {formatFileSize(summary.sourceBytes)} → {formatFileSize(summary.outputBytes)}). Try a
              lower quality or a different format.
            </p>
          ) : savings !== null ? (
            <p className="text-xs text-muted-foreground">
              Saved {formatFileSize(savings)} (
              {summary.sourceBytes > 0 ? Math.round((savings / summary.sourceBytes) * 100) : 0}
              %) · measured from the actual output file.
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
