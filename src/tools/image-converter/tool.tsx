"use client"

import { useState } from "react"
import { ArrowRight } from "lucide-react"
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
  readImageDimensions,
  validateImageBytes,
  type ImageFormat,
} from "@/lib/image"
import { decodeImageFile, encodeCanvas, createCanvas } from "@/lib/image/browser"
import { imageConverterEngine, CONVERT_FORMATS, type ConvertFormat } from "./engine"
import { manifest } from "./manifest"

const FORMAT_OPTIONS: SegmentedOption<ConvertFormat>[] = CONVERT_FORMATS.map((format) => ({
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

export default function ImageConverter() {
  const [source, setSource] = useState<SourceImage | null>(null)
  const [to, setTo] = useState<ConvertFormat>("webp")
  const [quality, setQuality] = useState(92)
  const [busy, setBusy] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)
  const [output, setOutput] = useState<OutputImage | null>(null)

  const { status, result, error, run, reset } = useTool(imageConverterEngine)

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

  const handleConvert = async () => {
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
      const blob = await encodeCanvas(canvas, to, quality)

      await run({
        bytes: source.bytes,
        bytesLength: source.bytes.length,
        to,
        quality,
        outputBytes: blob.size,
        outputWidth: source.width,
        outputHeight: source.height,
      })

      const base = source.file.name.replace(/\.[^.]+$/, "")
      setOutput({
        blob,
        filename: `${base}.${IMAGE_FORMAT_INFO[to].extension}`,
      })
    } catch (caught) {
      setLocalError(caught instanceof Error ? caught.message : "Conversion failed.")
    } finally {
      decoded?.close()
      setBusy(false)
    }
  }

  const handleReset = () => {
    handleClear()
    setTo("webp")
    setQuality(92)
  }

  const busyNow = busy || status === "processing" || status === "validating"
  const errorId = `${manifest.slug}-error`
  const summary = result?.output
  const sameFormat = source && source.format === to

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="flex flex-col gap-5">
        <FileDrop
          label="Drop an image to convert"
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

            <div className="flex flex-col gap-2">
              <Segmented label="Convert to" options={FORMAT_OPTIONS} value={to} onChange={setTo} />
              {sameFormat ? (
                <p className="text-xs text-muted-foreground">
                  The file is already {IMAGE_FORMAT_INFO[to].label} — converting will re-encode it.
                </p>
              ) : (
                <p className="flex items-center gap-1 text-xs text-muted-foreground">
                  <span>{IMAGE_FORMAT_INFO[source.format].label}</span>
                  <ArrowRight className="h-3 w-3" />
                  <span>{IMAGE_FORMAT_INFO[to].label}</span>
                </p>
              )}
            </div>

            {to === "png" ? (
              <p className="text-xs text-muted-foreground">
                PNG output is lossless — the quality control has no effect.
              </p>
            ) : (
              <QualitySlider
                label={`${IMAGE_FORMAT_INFO[to].label} quality`}
                value={quality}
                onChange={setQuality}
              />
            )}

            <div className="flex items-center gap-3">
              <Button onClick={() => void handleConvert()} disabled={busyNow || !source}>
                {busyNow ? "Converting…" : "Convert image"}
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

            <p className="text-xs text-muted-foreground">
              Metadata (EXIF) isn&apos;t carried over during conversion — the output is a fresh
              re-encode of the visible pixels.
            </p>
          </>
        ) : null}
      </div>

      {output && summary ? (
        <div className="flex flex-col gap-3">
          <OutputImageCard
            blob={output.blob}
            filename={output.filename}
            meta={`${summary.from.toUpperCase()} → ${summary.to.toUpperCase()}`}
          />
        </div>
      ) : null}
    </div>
  )
}
