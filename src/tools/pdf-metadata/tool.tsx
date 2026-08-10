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
import { pdfMetadataEngine } from "./engine"
import { manifest } from "./manifest"

interface SourcePdf {
  file: File
  bytes: Uint8Array
}

export default function PdfMetadata() {
  const [source, setSource] = useState<SourcePdf | null>(null)
  const [busy, setBusy] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)

  const { status, result, error, run, reset } = useTool(pdfMetadataEngine)

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

  const handleRead = async () => {
    if (!source) return
    setLocalError(null)
    setBusy(true)
    try {
      await run({ bytes: source.bytes, bytesLength: source.bytes.length })
    } catch (caught) {
      setLocalError(caught instanceof Error ? caught.message : "Reading the PDF failed.")
    } finally {
      setBusy(false)
    }
  }

  const busyNow = busy || status === "processing" || status === "validating"
  const errorId = `${manifest.slug}-error`
  const meta = result?.output

  const optionalRows: Array<{ label: string; value: string }> = meta
    ? [
        ...(meta.title ? [{ label: "Title", value: meta.title }] : []),
        ...(meta.author ? [{ label: "Author", value: meta.author }] : []),
        ...(meta.subject ? [{ label: "Subject", value: meta.subject }] : []),
        ...(meta.keywords ? [{ label: "Keywords", value: meta.keywords }] : []),
        ...(meta.creator ? [{ label: "Creator", value: meta.creator }] : []),
        ...(meta.producer ? [{ label: "Producer", value: meta.producer }] : []),
        ...(meta.creationDate ? [{ label: "Created", value: meta.creationDate }] : []),
        ...(meta.modificationDate ? [{ label: "Modified", value: meta.modificationDate }] : []),
      ]
    : []

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="flex flex-col gap-5">
        <FileDrop
          label="Drop a PDF to inspect"
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
              <Button onClick={() => void handleRead()} disabled={busyNow || !source}>
                {busyNow ? "Reading…" : "Read metadata"}
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
          <h2 className="font-semibold text-foreground">
            {meta.entryCount} metadata field{meta.entryCount === 1 ? "" : "s"} found
          </h2>
          <dl className="divide-y divide-border rounded-xl border border-border bg-surface/40">
            <div className="grid grid-cols-[minmax(0,11rem)_1fr] gap-4 px-4 py-2.5">
              <dt className="text-muted-foreground">Filename</dt>
              <dd className="break-words font-medium text-foreground">{source?.file.name}</dd>
            </div>
            <div className="grid grid-cols-[minmax(0,11rem)_1fr] gap-4 px-4 py-2.5">
              <dt className="text-muted-foreground">File size</dt>
              <dd className="font-medium text-foreground">{formatFileSize(meta.size)}</dd>
            </div>
            <div className="grid grid-cols-[minmax(0,11rem)_1fr] gap-4 px-4 py-2.5">
              <dt className="text-muted-foreground">MIME type</dt>
              <dd className="font-medium text-foreground">application/pdf</dd>
            </div>
            <div className="grid grid-cols-[minmax(0,11rem)_1fr] gap-4 px-4 py-2.5">
              <dt className="text-muted-foreground">Page count</dt>
              <dd className="font-medium text-foreground">{meta.pageCount}</dd>
            </div>
            <div className="grid grid-cols-[minmax(0,11rem)_1fr] gap-4 px-4 py-2.5">
              <dt className="text-muted-foreground">PDF version</dt>
              <dd className="font-medium text-foreground">{meta.version}</dd>
            </div>
            {optionalRows.map((row) => (
              <div
                key={row.label}
                className="grid grid-cols-[minmax(0,11rem)_1fr] gap-4 px-4 py-2.5"
              >
                <dt className="text-muted-foreground">{row.label}</dt>
                <dd className="break-words font-medium text-foreground">{row.value}</dd>
              </div>
            ))}
          </dl>
          {optionalRows.length === 0 ? (
            <p className="text-muted-foreground">
              This PDF doesn&apos;t carry any author-facing metadata beyond the basics.
            </p>
          ) : null}
          <p className="text-xs text-muted-foreground">
            Metadata is read from the file&apos;s bytes in your browser — nothing is uploaded or
            stored.
          </p>
        </div>
      ) : null}
    </div>
  )
}
