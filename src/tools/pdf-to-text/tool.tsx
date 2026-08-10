"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { CodeBlock } from "@/components/tool/outputs/code-block"
import { CopyButton } from "@/components/tool/outputs/copy-button"
import { ErrorAlert } from "@/components/tool/outputs/error-alert"
import { ExportMenu } from "@/components/tool/outputs/export-menu"
import { ResetButton } from "@/components/tool/outputs/reset-button"
import { FileDrop } from "@/components/tool/image/file-drop"
import { FileMeta } from "@/components/tool/image/file-meta"
import { ProcessingProgress } from "@/components/tool/image/processing-progress"
import { useTool } from "@/lib/tool-engine"
import { MAX_PDF_FILE_BYTES } from "@/lib/pdf/adapter"
import { configurePdfWorker } from "@/lib/pdf/pdf-worker"
import { pdfToTextEngine, NOT_FOUND_TEXT_MESSAGE } from "./engine"
import { manifest } from "./manifest"

interface SourcePdf {
  file: File
  bytes: Uint8Array
}

export default function PdfToText() {
  const [source, setSource] = useState<SourcePdf | null>(null)
  const [busy, setBusy] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)

  const { status, result, error, run, reset } = useTool(pdfToTextEngine)

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

  const handleExtract = async () => {
    if (!source) return
    setLocalError(null)
    setBusy(true)
    try {
      await run({ bytes: source.bytes, bytesLength: source.bytes.length })
    } catch (caught) {
      setLocalError(caught instanceof Error ? caught.message : "Extraction failed.")
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
          label="Drop a PDF to extract text"
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
              <Button onClick={() => void handleExtract()} disabled={busyNow || !source}>
                {busyNow ? "Extracting…" : "Extract text"}
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
        <div className="flex flex-col gap-3">
          {meta.foundText ? (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-muted-foreground">
                  {meta.characters} characters · {meta.words} words · {meta.pageCount} page
                  {meta.pageCount === 1 ? "" : "s"}
                </p>
                <div className="flex items-center gap-2">
                  <CopyButton text={meta.text} label="Copy text" />
                  <ExportMenu
                    value={meta.text}
                    filename={`${source?.file.name ?? "extracted"}.txt`}
                  />
                </div>
              </div>
              <CodeBlock maxHeight={480} aria-label="Extracted text">
                {meta.text}
              </CodeBlock>
              <p className="text-xs text-muted-foreground">
                Text is extracted locally and never leaves your device; the extracted content is
                also never stored in history — only the summary is.
              </p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">{NOT_FOUND_TEXT_MESSAGE}</p>
          )}
        </div>
      ) : null}
    </div>
  )
}
