"use client"

import { useMemo, useState, type FormEvent } from "react"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { CodeEditor } from "@/components/tool/inputs/code-editor"
import { Segmented } from "@/components/tool/inputs/segmented"
import { ErrorAlert } from "@/components/tool/outputs/error-alert"
import { OutputPanel } from "@/components/tool/outputs/output-panel"
import { ResetButton } from "@/components/tool/outputs/reset-button"
import { useTool } from "@/lib/tool-engine"
import { jsonFormatterEngine, type JsonMode } from "./engine"
import { manifest } from "./manifest"

const MODES = [
  { value: "pretty" as const, label: "Pretty" },
  { value: "minified" as const, label: "Minify" },
  { value: "validated" as const, label: "Validate" },
]

const INDENTS = [2, 4, 8]

export default function JsonFormatter() {
  const [json, setJson] = useState("")
  const [mode, setMode] = useState<JsonMode>("pretty")
  const [indent, setIndent] = useState(2)

  const { status, result, error, run, reset } = useTool(jsonFormatterEngine)

  const hasResult = result !== null
  const busy = status === "validating" || status === "processing"

  const exportValue = useMemo(() => {
    if (!result) return undefined
    try {
      return JSON.parse(result.output.text)
    } catch {
      return result.output.text
    }
  }, [result])

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    void run({ json, mode, indent })
  }

  const handleReset = () => {
    reset()
    setJson("")
    setMode("pretty")
    setIndent(2)
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
        <CodeEditor
          id={`${manifest.slug}-input`}
          label="JSON input"
          placeholder='Paste JSON here — e.g. {"hello":"world"}'
          value={json}
          onChange={(event) => setJson(event.target.value)}
          showCount
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? "json-formatter-error" : undefined}
        />

        <div className="flex flex-wrap items-end gap-4">
          <Segmented
            label="Action"
            options={MODES}
            value={mode}
            onChange={setMode}
            className="w-full sm:w-auto"
          />

          <div className="flex flex-col gap-2">
            <label htmlFor="json-indent" className="text-sm font-medium text-foreground">
              Indent
            </label>
            <Select
              value={String(indent)}
              onValueChange={(value) => setIndent(Number(value))}
              disabled={mode !== "pretty"}
            >
              <SelectTrigger id="json-indent" className="w-28">
                <SelectValue placeholder="Indent" />
              </SelectTrigger>
              <SelectContent>
                {INDENTS.map((option) => (
                  <SelectItem key={option} value={String(option)}>
                    {option} spaces
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={busy || json.trim() === ""}>
            {busy ? "Processing…" : "Run"}
          </Button>
          <ResetButton onClick={handleReset} disabled={busy || (!json && !hasResult)} />
        </div>

        <div id="json-formatter-error">
          <ErrorAlert error={error} />
        </div>
      </form>

      {hasResult && result ? (
        <OutputPanel
          text={result.output.text}
          value={exportValue}
          filename={`${manifest.slug}-${result.output.mode}`}
          title="Result"
          meta={
            <p className="text-xs text-muted-foreground">
              {result.output.mode} · {result.output.entries.toLocaleString()}{" "}
              {result.output.entries === 1 ? "top-level entry" : "top-level entries"} ·{" "}
              {result.output.bytes.toLocaleString()} bytes ·{" "}
              {result.metrics.processingMs.toFixed(1)} ms processing
            </p>
          }
        />
      ) : null}
    </div>
  )
}
