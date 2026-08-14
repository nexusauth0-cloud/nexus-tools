"use client"

import { useRef, useState } from "react"
import { FolderOpen } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CodeEditor } from "@/components/tool/inputs/code-editor"
import { Segmented } from "@/components/tool/inputs/segmented"
import { ErrorAlert } from "@/components/tool/outputs/error-alert"
import { OutputPanel } from "@/components/tool/outputs/output-panel"
import { ResetButton } from "@/components/tool/outputs/reset-button"
import { useTool } from "@/lib/tool-engine"
import { yamlEngine, type YamlDirection } from "./engine"
import { manifest } from "./manifest"

const DIRECTIONS = [
  { value: "to-json" as const, label: "YAML → JSON" },
  { value: "to-yaml" as const, label: "JSON → YAML" },
]

export default function YamlConverter() {
  const [yaml, setYaml] = useState("")
  const [direction, setDirection] = useState<YamlDirection>("to-json")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { status, result, error, run, reset } = useTool(yamlEngine)

  const hasResult = result !== null
  const busy = status === "validating" || status === "processing"
  const errorId = `${manifest.slug}-error`

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    void run({ yaml, direction })
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
      event.preventDefault()
      void run({ yaml, direction })
    }
  }

  const handleUpload = async (file: File) => {
    const text = await file.text()
    if (text.trim() === "") return
    setYaml(text)
  }

  const handleReset = () => {
    reset()
    setYaml("")
    setDirection("to-json")
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-5"
        noValidate
        aria-label="YAML to JSON conversion form"
      >
        <CodeEditor
          id={`${manifest.slug}-input`}
          label="Input"
          placeholder="Paste YAML or JSON here…"
          value={yaml}
          onChange={(event) => setYaml(event.target.value)}
          onKeyDown={handleKeyDown}
          showCount
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
        />

        <Segmented
          label="Direction"
          options={DIRECTIONS}
          value={direction}
          onChange={setDirection}
          className="w-full sm:w-auto"
        />

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={busy || yaml.trim() === ""}>
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
            accept=".yaml,.yml,.json,.txt,text/*"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0]
              if (file) void handleUpload(file)
              event.target.value = ""
            }}
          />
          <ResetButton onClick={handleReset} disabled={busy || (!yaml && !hasResult)} />
        </div>

        <div id={errorId}>
          <ErrorAlert error={error} />
        </div>
      </form>

      {hasResult && result ? (
        <OutputPanel
          text={result.output.text}
          value={result.output.text}
          filename={manifest.slug}
          title="Result"
          meta={
            <p className="text-xs text-muted-foreground">
              {result.output.shape} · {result.metrics.processingMs.toFixed(1)} ms
            </p>
          }
        />
      ) : null}
    </div>
  )
}
