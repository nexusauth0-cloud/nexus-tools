"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Segmented, type SegmentedOption } from "@/components/tool/inputs/segmented"
import { ErrorAlert } from "@/components/tool/outputs/error-alert"
import { ResetButton } from "@/components/tool/outputs/reset-button"
import { ProcessingProgress } from "@/components/tool/image/processing-progress"
import { useTool } from "@/lib/tool-engine"
import { textToPdfEngine } from "./engine"
import { manifest } from "./manifest"

const PAGE_SIZE_OPTIONS: SegmentedOption<"a4" | "letter">[] = [
  { value: "a4", label: "A4" },
  { value: "letter", label: "Letter" },
]

const MARGIN_OPTIONS: SegmentedOption<"narrow" | "normal" | "wide">[] = [
  { value: "narrow", label: "Narrow" },
  { value: "normal", label: "Normal" },
  { value: "wide", label: "Wide" },
]

const MARGIN_MM: Record<"narrow" | "normal" | "wide", number> = {
  narrow: 12,
  normal: 25,
  wide: 38,
}

export default function TextToPdf() {
  const [text, setText] = useState("")
  const [title, setTitle] = useState("")
  const [pageSize, setPageSize] = useState<"a4" | "letter">("a4")
  const [fontSize, setFontSize] = useState(12)
  const [margins, setMargins] = useState<"narrow" | "normal" | "wide">("normal")
  const [busy, setBusy] = useState(false)
  const [prevMeta, setPrevMeta] = useState<Uint8Array | null>(null)
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)

  const { status, result, error, run, reset } = useTool(textToPdfEngine)

  const lineHeight = useMemo(() => (fontSize <= 10 ? 1.5 : fontSize <= 13 ? 1.4 : 1.3), [fontSize])

  useEffect(() => {
    return () => {
      if (downloadUrl) URL.revokeObjectURL(downloadUrl)
    }
  }, [downloadUrl])

  const handleCreate = async () => {
    setBusy(true)
    try {
      await run({
        text,
        title: title.trim() || undefined,
        pageSize,
        fontSize,
        lineHeight,
        marginsMm: MARGIN_MM[margins],
      })
    } catch {
      // ToolExecutionError messages surface through `error` (ErrorAlert).
    } finally {
      setBusy(false)
    }
  }

  const handleReset = () => {
    setText("")
    setTitle("")
    setPageSize("a4")
    setFontSize(12)
    setMargins("normal")
    reset()
    setDownloadUrl((previous) => {
      if (previous) URL.revokeObjectURL(previous)
      return null
    })
    setPrevMeta(null)
  }

  const busyNow = busy || status === "processing" || status === "validating"
  const errorId = `${manifest.slug}-error`
  const meta = result?.output

  const metaBytes = meta?.bytes ?? null
  if (metaBytes !== null && metaBytes !== prevMeta) {
    if (downloadUrl) URL.revokeObjectURL(downloadUrl)
    const blob = new Blob([metaBytes.slice().buffer], { type: "application/pdf" })
    setPrevMeta(metaBytes)
    setDownloadUrl(URL.createObjectURL(blob))
  }

  const stem =
    title
      .trim()
      .replace(/[^a-z0-9]+/gi, "-")
      .replace(/^-+|-+$/g, "") || "document"

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="flex flex-col gap-5">
        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-foreground">Text</span>
          <Textarea
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="Paste or type the text you want in the PDF…"
            rows={10}
            className="min-h-40"
          />
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-foreground">
            Title <span className="font-normal text-muted-foreground">(optional)</span>
          </span>
          <Input
            id={`${manifest.slug}-title`}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Document title"
          />
        </label>

        <Segmented
          label="Page size"
          options={PAGE_SIZE_OPTIONS}
          value={pageSize}
          onChange={setPageSize}
        />

        <div className="flex flex-wrap items-center gap-4">
          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium text-foreground">Font size (pt)</span>
            <Input
              id={`${manifest.slug}-font`}
              type="number"
              min={6}
              max={16}
              value={fontSize}
              onChange={(event) => setFontSize(Number(event.target.value) || 12)}
              className="w-28"
            />
          </label>
          <Segmented
            label="Margins"
            options={MARGIN_OPTIONS}
            value={margins}
            onChange={setMargins}
          />
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={() => void handleCreate()}
            disabled={busyNow || text.trim().length === 0}
          >
            {busyNow ? "Generating…" : "Create PDF"}
          </Button>
          <ResetButton onClick={handleReset} disabled={busyNow || (!meta && text.length === 0)} />
        </div>

        {busyNow ? <ProcessingProgress label="Laying out and writing the PDF…" /> : null}

        <div id={errorId}>
          <ErrorAlert error={error} />
        </div>
      </div>

      {meta ? (
        <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface/40 p-4">
          <p className="text-sm font-medium text-foreground">{stem}.pdf</p>
          <p className="text-sm text-muted-foreground">
            {meta.pages} page{meta.pages === 1 ? "" : "s"} · {Math.round(meta.size / 1024)} KB·
            {pageSize === "a4" ? " A4" : " Letter"}
          </p>
          {meta.droppedCharacters > 0 ? (
            <p className="text-sm text-amber-600 dark:text-amber-500">
              {meta.droppedCharacters} character{meta.droppedCharacters === 1 ? "" : "s"} could not
              be represented and were replaced with &quot;?&quot; — review the text before use.
            </p>
          ) : null}
          <Button asChild disabled={!downloadUrl}>
            <a href={downloadUrl ?? undefined} download={`${stem}.pdf`}>
              Download PDF
            </a>
          </Button>
          <p className="text-xs text-muted-foreground">
            The PDF is generated entirely in your browser — nothing is uploaded, and the document
            contents are never stored in history.
          </p>
        </div>
      ) : null}
    </div>
  )
}
