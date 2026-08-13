"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CodeBlock } from "@/components/tool/outputs/code-block"
import { ErrorAlert } from "@/components/tool/outputs/error-alert"
import { useTool, useClipboard } from "@/lib/tool-engine"
import { Upload, X, AlertTriangle, ArrowUpRight } from "lucide-react"
import { qrReaderEngine } from "./engine"
import { manifest } from "./manifest"
import {
  QR_ACCEPTED_MIME_TYPES,
  QR_MAX_IMAGE_BYTES,
  QR_MAX_IMAGE_PIXELS,
  isAcceptedImageMime,
} from "./limits"
import { isSafeActionable, type QrDecodedContent } from "@/lib/qr"

interface LoadedImage {
  dataUrl: string
  fileName: string
  fileSize: number
  mime: string
  width: number
  height: number
  rgba: Uint8ClampedArray
}

const ACCEPT = QR_ACCEPTED_MIME_TYPES.join(",")

/** Load an image file → RGBA pixels entirely on the client. */
async function loadImage(file: File): Promise<LoadedImage> {
  if (!isAcceptedImageMime(file.type)) {
    throw new Error(`Unsupported file type "${file.type || "unknown"}". Use PNG, JPEG, or WebP.`)
  }
  if (file.size > QR_MAX_IMAGE_BYTES) {
    throw new Error(`File is too large (${Math.round(file.size / 1024 / 1024)} MB, max 10 MB).`)
  }

  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error("Could not read the image file."))
    reader.readAsDataURL(file)
  })

  const bitmap = await createImageBitmap(file)
  if (bitmap.width > QR_MAX_IMAGE_PIXELS || bitmap.height > QR_MAX_IMAGE_PIXELS) {
    bitmap.close()
    throw new Error(
      `Image is too large (${bitmap.width}×${bitmap.height}, max ${QR_MAX_IMAGE_PIXELS}px per side).`
    )
  }

  const canvas = document.createElement("canvas")
  canvas.width = bitmap.width
  canvas.height = bitmap.height
  const context = canvas.getContext("2d", { willReadFrequently: true })
  if (!context) {
    bitmap.close()
    throw new Error("This browser cannot decode images on-device.")
  }
  context.drawImage(bitmap, 0, 0)
  bitmap.close()
  const imageData = context.getImageData(0, 0, canvas.width, canvas.height)

  return {
    dataUrl,
    fileName: file.name,
    fileSize: file.size,
    mime: file.type,
    width: imageData.width,
    height: imageData.height,
    rgba: imageData.data,
  }
}

export default function QrReader() {
  const [image, setImage] = React.useState<LoadedImage | null>(null)
  const [pickError, setPickError] = React.useState<string | null>(null)
  const [dragging, setDragging] = React.useState(false)
  const { copy, copied } = useClipboard()

  const { status, result, error, run, reset } = useTool(qrReaderEngine)
  const busy = status === "validating" || status === "processing"
  const errorId = `${manifest.slug}-error`

  const scan = React.useCallback(
    (loaded: LoadedImage) => {
      void run({
        width: loaded.width,
        height: loaded.height,
        data: loaded.rgba,
        fileName: loaded.fileName,
        fileSizeBytes: loaded.fileSize,
        mime: loaded.mime,
      })
    },
    [run]
  )

  const decode = async (file: File) => {
    setPickError(null)
    try {
      const loaded = await loadImage(file)
      setImage(loaded)
      scan(loaded)
    } catch (caught) {
      setPickError(caught instanceof Error ? caught.message : "Could not load that image.")
    }
  }

  const handleFileInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) void decode(file)
    event.target.value = ""
  }

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault()
    setDragging(false)
    const file = event.dataTransfer.files?.[0]
    if (file) void decode(file)
  }

  const handleReset = () => {
    reset()
    setImage(null)
    setPickError(null)
  }

  const output = result?.output
  const content: QrDecodedContent | null = output?.content ?? null
  const actionable = content ? isSafeActionable(content.actionUri) : false

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="flex flex-col gap-5">
        <input
          type="file"
          accept={ACCEPT}
          onChange={handleFileInput}
          className="sr-only"
          id={`${manifest.slug}-file-input`}
          aria-label="Choose an image containing a QR code"
        />
        <label
          htmlFor={`${manifest.slug}-file-input`}
          onDragOver={(event) => {
            event.preventDefault()
            setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          className={`flex min-h-56 cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-6 text-center transition-colors focus-within:ring-2 focus-within:ring-ring ${
            dragging ? "border-primary bg-primary/5" : "border-border bg-background/40"
          }`}
        >
          <Upload className="size-8 text-muted-foreground" aria-hidden="true" />
          <span className="text-sm font-medium">Drop a QR code image here, or click to choose</span>
          <span className="text-xs text-muted-foreground">
            PNG · JPEG · WebP — up to 10 MB. Processing never leaves your browser.
          </span>
        </label>

        {pickError ? (
          <p
            role="alert"
            className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2.5 text-sm text-destructive"
          >
            {pickError}
          </p>
        ) : null}

        <div id={errorId}>
          <ErrorAlert error={error} />
        </div>

        {image ? (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Loaded image</CardTitle>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleReset}
                aria-label="Remove image"
              >
                <X />
                Remove
              </Button>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <img
                src={image.dataUrl}
                alt="Uploaded image being scanned"
                className="max-h-64 w-auto self-center rounded-lg border border-border object-contain"
              />
              <p className="break-all text-xs text-muted-foreground">
                {image.fileName} — {image.width}×{image.height}px,{" "}
                {Math.round(image.fileSize / 1024)} KB
              </p>
              <Button type="button" onClick={() => scan(image)} disabled={busy}>
                {busy ? "Scanning…" : "Scan again"}
              </Button>
            </CardContent>
          </Card>
        ) : null}

        <p className="rounded-lg border border-border bg-background/40 px-3 py-2.5 text-xs text-muted-foreground">
          Decoded content is shown as untrusted data. This tool never opens links or dialers
          automatically — you choose whether to act.
        </p>
      </div>

      <div className="flex flex-col gap-6">
        {content ? (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Decoded content</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <CodeBlock maxHeight={200} aria-label="Decoded QR payload">
                  {content.text}
                </CodeBlock>
                {actionable && content.actionUri ? (
                  <Button type="button" variant="outline" size="sm" asChild>
                    <a href={content.actionUri} target="_blank" rel="noopener noreferrer">
                      <ArrowUpRight />
                      {content.actionLabel}
                    </a>
                  </Button>
                ) : null}
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => copy(content.text)}
                    disabled={!content.text}
                  >
                    {copied ? "Copied" : "Copy text"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg border border-border bg-background/40 px-3 py-2">
                <dt className="text-xs text-muted-foreground">Likely type</dt>
                <dd className="mt-0.5 font-medium capitalize">{content.classification.type}</dd>
              </div>
              <div className="rounded-lg border border-border bg-background/40 px-3 py-2">
                <dt className="text-xs text-muted-foreground">Characters</dt>
                <dd className="mt-0.5 font-medium">{content.characterCount}</dd>
              </div>
              <div className="col-span-2 rounded-lg border border-border bg-background/40 px-3 py-2">
                <dt className="text-xs text-muted-foreground">Format</dt>
                <dd className="mt-0.5 font-medium">{output?.format ?? "QR (matrix code)"}</dd>
              </div>
            </dl>

            <p
              role="note"
              className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2.5 text-sm text-amber-700 dark:text-amber-400"
            >
              <AlertTriangle className="mt-0.5 size-4 shrink-0" />
              Classification is a heuristic guess. Treat scanned content as untrusted — a QR code
              can contain a malicious link, and this tool cannot verify it.
            </p>
          </>
        ) : (
          <div className="flex min-h-64 items-center justify-center rounded-xl border border-dashed border-border bg-background/40 p-6 text-sm text-muted-foreground">
            Decoded content and scan details appear here.
          </div>
        )}
      </div>
    </div>
  )
}
