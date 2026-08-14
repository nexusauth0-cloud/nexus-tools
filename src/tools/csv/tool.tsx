"use client"

import { useRef, useState } from "react"
import { FolderOpen } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CodeEditor } from "@/components/tool/inputs/code-editor"
import { ErrorAlert } from "@/components/tool/outputs/error-alert"
import { OutputPanel } from "@/components/tool/outputs/output-panel"
import { ResetButton } from "@/components/tool/outputs/reset-button"
import { CodeBlock } from "@/components/tool/outputs/code-block"
import { CopyButton } from "@/components/tool/outputs/copy-button"
import { useTool } from "@/lib/tool-engine"
import { csvEngine } from "./engine"
import { manifest } from "./manifest"

export default function CsvToJson() {
  const [csv, setCsv] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { status, result, error, run, reset } = useTool(csvEngine)

  const hasResult = result !== null
  const busy = status === "validating" || status === "processing"
  const errorId = `${manifest.slug}-error`

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    void run({ csv })
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
      event.preventDefault()
      void run({ csv })
    }
  }

  const handleUpload = async (file: File) => {
    const text = await file.text()
    if (text.trim() === "") return
    setCsv(text)
  }

  const handleReset = () => {
    reset()
    setCsv("")
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-5"
        noValidate
        aria-label="CSV to JSON conversion form"
      >
        <CodeEditor
          id={`${manifest.slug}-input`}
          label="CSV input"
          placeholder="Paste CSV here…"
          value={csv}
          onChange={(event) => setCsv(event.target.value)}
          onKeyDown={handleKeyDown}
          showCount
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
        />

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={busy || csv.trim() === ""}>
            {busy ? "Converting…" : "Convert"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            aria-label="Open a file"
          >
            <FolderOpen className="mr-2 size-4" aria-hidden="true" />
            Open file
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.txt,text/*"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0]
              if (file) void handleUpload(file)
              event.target.value = ""
            }}
          />
          <ResetButton onClick={handleReset} disabled={busy || (!csv && !hasResult)} />
        </div>

        <div id={errorId}>
          <ErrorAlert error={error} />
        </div>
      </form>

      {hasResult && result ? (
        <div className="flex flex-col gap-4">
          <OutputPanel
            text={result.output.text}
            value={result.output.text}
            filename={manifest.slug}
            title="JSON result"
            meta={
              <p className="text-xs text-muted-foreground">
                {result.output.rows} row{result.output.rows === 1 ? "" : "s"} ·{" "}
                {result.output.columns} column{result.output.columns === 1 ? "" : "s"} ·{" "}
                {result.metrics.processingMs.toFixed(1)} ms
              </p>
            }
          />
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium text-foreground">Preview</p>
            <div className="relative">
              <CodeBlock className="max-h-64 overflow-auto">{result.output.preview}</CodeBlock>
              <CopyButton
                text={result.output.preview}
                label="Copy"
                className="absolute right-2 top-2"
              />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
