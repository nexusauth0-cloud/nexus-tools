"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ErrorAlert } from "@/components/tool/outputs/error-alert"
import { ResetButton } from "@/components/tool/outputs/reset-button"
import { FileDrop } from "@/components/tool/image/file-drop"
import { FileMeta } from "@/components/tool/image/file-meta"
import { ProcessingProgress } from "@/components/tool/image/processing-progress"
import { useTool } from "@/lib/tool-engine"
import { formatFileSize } from "@/lib/image"
import { MAX_PDF_FILE_BYTES } from "@/lib/pdf/adapter"
import { configurePdfWorker } from "@/lib/pdf/pdf-worker"
import { pdfPageCounterEngine } from "./engine"
import { manifest } from "./manifest"

interface SourcePdf {
  file: File
  bytes: Uint8Array
}

export default function PdfPageCounter() {
  const [source, setSource] = useState<SourcePdf | null>(null)
  const [busy, setBusy] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)

  const { status, result, error, run, reset } = useTool(pdfPageCounterEngine)

  const handleSelect = async (file: File) => {
    configurePdfWorker()
    setLocalError(null)
    setSource({ file, bytes: new Uint8Array(await file.arrayBuffer()) })
  }

  const handleClear = () => {
    setSource(null)
    reset()
    setLocalError(null)
  }

  const handleCount = async () => {
    if (!source) return
    setLocalError(null)
    setBusy(true)
    try {
      await run({ bytes: source.bytes, bytesLength: source.bytes.length })
    } catch (caught) {
      setLocalError(caught instanceof Error ? caught.message : "Counting failed.")
    } finally {
      setBusy(false)
    }
  }

  const busyNow = busy || status === "processing" || status === "validating"
  const errorId = `${manifest.slug}-error`
  const meta = result?.output

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="flex flex-col gap-5">
        <FileDrop
          label="Drop a PDF to count its pages"
          onSelect={(file) => void handleSelect(file)}
          onClear={source ? handleClear : undefined}
          disabled={busyNow}
          accept="application/pdf,.pdf"
          acceptHint="Only PDF files are supported."
          maxBytes={MAX_PDF_FILE_BYTES}
          sizeHint="max 25 MB"
        />
        {source ? (
          <>
            <FileMeta file={source.file} format="PDF" />

            <div className="flex items-center gap-3">
              <Button onClick={() => void handleCount()} disabled={busyNow || !source}>
                {busyNow ? "Counting…" : "Count pages"}
              </Button>
              <ResetButton onClick={handleClear} disabled={busyNow || (!source && !result)} />
            </div>

            {busyNow ? <ProcessingProgress label="Parsing the PDF in your browser…" /> : null}

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
          <p className="text-6xl font-bold text-foreground">{meta.pageCount}</p>
          <p className="font-medium text-foreground">
            page{meta.pageCount === 1 ? "" : "s"} in {source?.file.name}
          </p>
          <dl className="divide-y divide-border rounded-xl border border-border bg-surface/40">
            <div className="grid grid-cols-[minmax(0,11rem)_1fr] gap-4 px-4 py-2.5">
              <dt className="text-muted-foreground">PDF version</dt>
              <dd className="font-medium text-foreground">{meta.version}</dd>
            </div>
            <div className="grid grid-cols-[minmax(0,11rem)_1fr] gap-4 px-4 py-2.5">
              <dt className="text-muted-foreground">File size</dt>
              <dd className="font-medium text-foreground">{formatFileSize(meta.size)}</dd>
            </div>
          </dl>
          <p className="text-xs text-muted-foreground">
            The count comes from parsing the document structure in your browser — nothing is
            uploaded.
          </p>
        </div>
      ) : null}
    </div>
  )
}
