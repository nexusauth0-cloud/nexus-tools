"use client"

import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
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
  computeResizePlan,
  IMAGE_FORMAT_INFO,
  readImageDimensions,
  validateImageBytes,
  type ImageFormat,
} from "@/lib/image"
import { decodeImageFile, encodeCanvas, createCanvas } from "@/lib/image/browser"
import { imageResizerEngine, RESIZE_FORMATS, type ResizeFormat } from "./engine"
import { manifest } from "./manifest"

const FORMAT_OPTIONS: SegmentedOption<ResizeFormat>[] = RESIZE_FORMATS.map((format) => ({
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
  width: number
  height: number
}

export default function ImageResizer() {
  const [source, setSource] = useState<SourceImage | null>(null)
  const [width, setWidth] = useState("800")
  const [height, setHeight] = useState("600")
  const [lockAspect, setLockAspect] = useState(true)
  const [format, setFormat] = useState<ResizeFormat>("jpeg")
  const [quality, setQuality] = useState(90)
  const [busy, setBusy] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)
  const [output, setOutput] = useState<OutputImage | null>(null)

  const { status, result, error, run, reset } = useTool(imageResizerEngine)

  const aspect = source ? source.width / source.height : 16 / 9

  const derivedHeight = useMemo(() => {
    const w = Number(width)
    if (!Number.isFinite(w) || w <= 0) return null
    return Math.max(1, Math.round(w / aspect))
  }, [width, aspect])

  const plan = useMemo(() => {
    if (!source) return null
    return computeResizePlan({
      sourceWidth: source.width,
      sourceHeight: source.height,
      width: Number(width) || 0,
      height: Number(height) || 0,
      lockAspect,
      noUpscale: true,
    })
  }, [source, width, height, lockAspect])

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
      const autoWidth = Math.min(dims.width, 800)
      setWidth(String(autoWidth))
      setHeight(String(Math.max(1, Math.round((autoWidth * dims.height) / dims.width))))
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

  const handleResize = async () => {
    if (!source || !plan) return
    setLocalError(null)
    setBusy(true)
    let decoded: Awaited<ReturnType<typeof decodeImageFile>> | null = null
    try {
      decoded = await decodeImageFile(source.file)
      const canvas = createCanvas(plan.targetWidth, plan.targetHeight)
      const context = canvas.getContext("2d")
      if (!context) throw new Error("Canvas isn't available in this browser.")
      context.imageSmoothingQuality = "high"
      context.drawImage(decoded.source, 0, 0, plan.targetWidth, plan.targetHeight)
      const blob = await encodeCanvas(canvas, format, quality)

      await run({
        bytes: source.bytes,
        bytesLength: source.bytes.length,
        width: plan.targetWidth,
        height: plan.targetHeight,
        lockAspect,
        format,
        quality,
        outputBytes: blob.size,
        outputWidth: plan.targetWidth,
        outputHeight: plan.targetHeight,
      })

      const base = source.file.name.replace(/\.[^.]+$/, "")
      setOutput({
        blob,
        filename: `${base}-${plan.targetWidth}x${plan.targetHeight}.${IMAGE_FORMAT_INFO[format].extension}`,
        width: plan.targetWidth,
        height: plan.targetHeight,
      })
    } catch (caught) {
      setLocalError(caught instanceof Error ? caught.message : "Resizing failed.")
    } finally {
      decoded?.close()
      setBusy(false)
    }
  }

  const handleReset = () => {
    handleClear()
    setWidth("800")
    setHeight("600")
    setQuality(90)
    setFormat("jpeg")
    setLockAspect(true)
  }

  const busyNow = busy || status === "processing" || status === "validating"
  const errorId = `${manifest.slug}-error`
  const summary = result?.output

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="flex flex-col gap-5">
        <FileDrop
          label="Drop an image to resize"
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

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor={`${manifest.slug}-width`}>Target width (px)</Label>
                <Input
                  id={`${manifest.slug}-width`}
                  type="number"
                  min={1}
                  max={60000}
                  value={width}
                  onChange={(event) => {
                    setWidth(event.target.value)
                    if (lockAspect) {
                      const w = Number(event.target.value)
                      if (Number.isFinite(w) && w > 0) {
                        setHeight(
                          String(Math.max(1, Math.round((w * source.height) / source.width)))
                        )
                      }
                    }
                  }}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor={`${manifest.slug}-height`}>Target height (px)</Label>
                <Input
                  id={`${manifest.slug}-height`}
                  type="number"
                  min={1}
                  max={60000}
                  value={lockAspect && derivedHeight !== null ? String(derivedHeight) : height}
                  disabled={lockAspect}
                  onChange={(event) => setHeight(event.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center justify-between gap-3">
              <Label htmlFor={`${manifest.slug}-lock`}>Lock aspect ratio</Label>
              <Switch
                id={`${manifest.slug}-lock`}
                checked={lockAspect}
                onCheckedChange={(checked) => setLockAspect(checked)}
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              Presets:
              {[0.25, 0.5, 0.75, 1].map((scale) => {
                const w = Math.max(1, Math.round(source.width * scale))
                const h = Math.max(1, Math.round(w / aspect))
                return (
                  <button
                    key={scale}
                    type="button"
                    onClick={() => {
                      setWidth(String(w))
                      setHeight(String(h))
                    }}
                    className="rounded-md border border-border bg-surface/50 px-2 py-1 font-medium hover:bg-surface-2"
                  >
                    {Math.round(scale * 100)}%
                  </button>
                )
              })}
              {plan?.capped ? (
                <span className="rounded-md bg-amber-500/10 px-2 py-1 text-amber-600 dark:text-amber-500">
                  No upscaling: capped to {source.width}×{source.height}
                </span>
              ) : null}
            </div>

            <Segmented
              label="Output format"
              options={FORMAT_OPTIONS}
              value={format}
              onChange={setFormat}
            />
            {format === "png" ? (
              <p className="text-xs text-muted-foreground">
                PNG output is lossless — the quality control has no effect.
              </p>
            ) : (
              <QualitySlider label="Quality" value={quality} onChange={setQuality} />
            )}

            <div className="flex items-center gap-3">
              <Button onClick={() => void handleResize()} disabled={busyNow || !source}>
                {busyNow ? "Resizing…" : "Resize image"}
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

      {output ? (
        <div className="flex flex-col gap-3">
          <OutputImageCard
            blob={output.blob}
            filename={output.filename}
            meta={`${output.width} × ${output.height}px`}
          />
          {summary ? (
            <p className="text-xs text-muted-foreground">
              {summary.sourceWidth}×{summary.sourceHeight}px → {summary.targetWidth}×
              {summary.targetHeight}px · {summary.format.toUpperCase()}
              {summary.capped ? " · capped — never upscaled" : ""}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
