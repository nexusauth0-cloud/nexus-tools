"use client"

import { useCallback, useRef, useState } from "react"
import { FlipHorizontal2, FlipVertical2, RotateCw, RotateCcw } from "lucide-react"
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
  computeCropPlan,
  IMAGE_FORMAT_INFO,
  readImageDimensions,
  validateImageBytes,
  type ImageFormat,
} from "@/lib/image"
import { cropAndEncode, decodeImageFile } from "@/lib/image/browser"
import { imageCropperEngine, CROP_RATIOS, type CropRatio } from "./engine"
import { manifest } from "./manifest"

const RATIO_OPTIONS: SegmentedOption<CropRatio>[] = CROP_RATIOS.map((ratio) => ({
  value: ratio,
  label: ratio === "free" ? "Free" : ratio,
}))

interface SourceImage {
  file: File
  bytes: Uint8Array
  format: ImageFormat
  width: number
  height: number
}

interface Selection {
  x: number
  y: number
  width: number
  height: number
}

interface OutputImage {
  blob: Blob
  filename: string
}

function parseRatio(ratio: CropRatio): { w: number; h: number } | null {
  if (ratio === "free") return null
  const [w, h] = ratio.split(":").map(Number)
  return { w, h }
}

/** Default selection (full image, clamped to the chosen ratio) — pure and render-derived. */
function defaultSelection(source: SourceImage, ratio: CropRatio): Selection {
  return computeCropPlan({
    sourceWidth: source.width,
    sourceHeight: source.height,
    x: 0,
    y: 0,
    width: source.width,
    height: source.height,
    ratio: parseRatio(ratio),
    rotation: 0,
  }).selection
}

export default function ImageCropper() {
  const [source, setSource] = useState<SourceImage | null>(null)
  const [ratio, setRatio] = useState<CropRatio>("free")
  const [rotation, setRotation] = useState(0)
  const [flipH, setFlipH] = useState(false)
  const [flipV, setFlipV] = useState(false)
  const [format, setFormat] = useState<"jpeg" | "png" | "webp">("png")
  const [quality, setQuality] = useState(92)
  const [busy, setBusy] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)
  const [output, setOutput] = useState<OutputImage | null>(null)

  const selectionKey = source
    ? `${source.width}x${source.height}:${ratio}:${source.file.name}`
    : "none"
  const [draftSelection, setDraftSelection] = useState<{
    key: string
    selection: Selection
  } | null>(null)
  const selection =
    draftSelection && draftSelection.key === selectionKey
      ? draftSelection.selection
      : source
        ? defaultSelection(source, ratio)
        : { x: 0, y: 0, width: 1, height: 1 }

  const setSelection = (selection: Selection) => {
    setDraftSelection({ key: selectionKey, selection })
  }

  const previewRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<{ startX: number; startY: number } | null>(null)

  const { status, result, error, run, reset } = useTool(imageCropperEngine)

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
      setRotation(0)
      setFlipH(false)
      setFlipV(false)
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

  const toNatural = useCallback(
    (clientX: number, clientY: number): { x: number; y: number } | null => {
      const box = previewRef.current
      if (!box || !source) return null
      const rect = box.getBoundingClientRect()
      const scaleX = source.width / rect.width
      const scaleY = source.height / rect.height
      return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY,
      }
    },
    [source]
  )

  const startDrag = (event: React.PointerEvent) => {
    if (!source) return
    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    dragRef.current = { startX: event.clientX, startY: event.clientY }
  }

  const moveDrag = (event: React.PointerEvent) => {
    if (!dragRef.current || !source) return
    const current = toNatural(event.clientX, event.clientY)
    const start = toNatural(dragRef.current.startX, dragRef.current.startY)
    if (!current || !start) return
    const x = Math.min(start.x, current.x)
    const y = Math.min(start.y, current.y)
    const width = Math.max(1, Math.abs(current.x - start.x))
    const height = Math.max(1, Math.abs(current.y - start.y))
    setSelection({ x, y, width, height })
  }

  const endDrag = () => {
    dragRef.current = null
  }

  const handleCrop = async () => {
    if (!source) return
    const plan = computeCropPlan({
      sourceWidth: source.width,
      sourceHeight: source.height,
      x: selection.x,
      y: selection.y,
      width: selection.width,
      height: selection.height,
      ratio: parseRatio(ratio),
      rotation,
    })

    setLocalError(null)
    setBusy(true)
    let decoded: Awaited<ReturnType<typeof decodeImageFile>> | null = null
    try {
      decoded = await decodeImageFile(source.file)
      const blob = await cropAndEncode(
        decoded.source,
        plan.selection,
        plan.rotation,
        flipH,
        flipV,
        format,
        format === "png" ? undefined : quality
      )

      await run({
        bytes: source.bytes,
        bytesLength: source.bytes.length,
        x: plan.selection.x,
        y: plan.selection.y,
        width: plan.selection.width,
        height: plan.selection.height,
        ratio,
        rotation,
        flipH,
        flipV,
        format,
        quality,
        outputBytes: blob.size,
        outputWidth: plan.rotatedWidth,
        outputHeight: plan.rotatedHeight,
      })

      const base = source.file.name.replace(/\.[^.]+$/, "")
      setOutput({
        blob,
        filename: `${base}-crop.${IMAGE_FORMAT_INFO[format].extension}`,
      })
    } catch (caught) {
      setLocalError(caught instanceof Error ? caught.message : "Cropping failed.")
    } finally {
      decoded?.close()
      setBusy(false)
    }
  }

  const handleReset = () => {
    handleClear()
    setRatio("free")
    setFormat("png")
    setQuality(92)
  }

  const busyNow = busy || status === "processing" || status === "validating"
  const errorId = `${manifest.slug}-error`
  const summary = result?.output

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="flex flex-col gap-5">
        <FileDrop
          label="Drop an image to crop"
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

            <div
              ref={previewRef}
              className="relative cursor-crosshair touch-none select-none overflow-hidden rounded-xl border border-border bg-surface/40"
              onPointerDown={startDrag}
              onPointerMove={moveDrag}
              onPointerUp={endDrag}
              onPointerCancel={endDrag}
            >
              <ImagePreview file={source.file} alt={`Crop preview of ${source.file.name}`} />
              <div
                className="pointer-events-none absolute border-2 border-primary bg-primary/10"
                style={{
                  left: `${(selection.x / source.width) * 100}%`,
                  top: `${(selection.y / source.height) * 100}%`,
                  width: `${(selection.width / source.width) * 100}%`,
                  height: `${(selection.height / source.height) * 100}%`,
                }}
              >
                <span className="absolute -top-6 left-0 whitespace-nowrap text-[11px] font-medium text-foreground">
                  {Math.round(selection.width)} × {Math.round(selection.height)}px
                </span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Drag to draw the crop region · touch works too ({Math.round(selection.width)} ×{" "}
              {Math.round(selection.height)} px of {source.width} × {source.height} px)
            </p>

            <Segmented
              label="Aspect ratio"
              options={RATIO_OPTIONS}
              value={ratio}
              onChange={setRatio}
            />

            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setRotation((rotation + 1) % 4)}
              >
                <RotateCw />
                Rotate 90°
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setRotation((rotation + 3) % 4)}
              >
                <RotateCcw />
                Rotate back
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                aria-pressed={flipH}
                onClick={() => setFlipH((value) => !value)}
              >
                <FlipHorizontal2 />
                Flip H
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                aria-pressed={flipV}
                onClick={() => setFlipV((value) => !value)}
              >
                <FlipVertical2 />
                Flip V
              </Button>
            </div>

            <div className="flex flex-col gap-2">
              <Segmented
                label="Output format"
                options={(["jpeg", "png", "webp"] as const).map((value) => ({
                  value,
                  label: IMAGE_FORMAT_INFO[value].label,
                }))}
                value={format}
                onChange={setFormat}
              />
              {format === "png" ? (
                <p className="text-xs text-muted-foreground">PNG output is lossless.</p>
              ) : (
                <QualitySlider label="Quality" value={quality} onChange={setQuality} />
              )}
            </div>

            <div className="flex items-center gap-3">
              <Button onClick={() => void handleCrop()} disabled={busyNow || !source}>
                {busyNow ? "Cropping…" : "Crop image"}
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
          <OutputImageCard
            blob={output.blob}
            filename={output.filename}
            meta={`${summary.outputWidth} × ${summary.outputHeight}px`}
          />
          <p className="text-xs text-muted-foreground">
            Crop {summary.selection.width}×{summary.selection.height}px at ({summary.selection.x},
            {summary.selection.y}){summary.rotation ? ` · rotated ${summary.rotation * 90}°` : ""}
            {summary.flipH || summary.flipV ? " · flipped" : ""}
          </p>
        </div>
      ) : null}
    </div>
  )
}
