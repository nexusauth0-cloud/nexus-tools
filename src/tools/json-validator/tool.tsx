"use client"

import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { CodeEditor } from "@/components/tool/inputs/code-editor"
import { ErrorAlert } from "@/components/tool/outputs/error-alert"
import { OutputPanel } from "@/components/tool/outputs/output-panel"
import { ResetButton } from "@/components/tool/outputs/reset-button"
import { useTool } from "@/lib/tool-engine"
import { jsonValidatorEngine } from "./engine"
import { manifest } from "./manifest"

export default function JsonValidator() {
  const [json, setJson] = useState("")

  const { status, result, error, run, reset } = useTool(jsonValidatorEngine)

  const hasResult = result !== null
  const busy = status === "validating" || status === "processing"
  const errorId = "json-validator-error"

  const exportValue = useMemo(() => {
    if (!result) return undefined
    try {
      return JSON.parse(result.output.text)
    } catch {
      return result.output.text
    }
  }, [result])

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    void run({ json })
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
      event.preventDefault()
      void run({ json })
    }
  }

  const handleReset = () => {
    reset()
    setJson("")
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-5"
        noValidate
        aria-label="JSON input form"
      >
        <CodeEditor
          id="json-validator-input"
          label="JSON input"
          placeholder='Paste JSON here — e.g. {"hello":"world"}'
          value={json}
          onChange={(event) => setJson(event.target.value)}
          onKeyDown={handleKeyDown}
          showCount
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
        />

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={busy || json.trim() === ""}>
            {busy ? "Validating…" : "Validate"}
          </Button>
          <ResetButton onClick={handleReset} disabled={busy || (!json && !hasResult)} />
        </div>

        <div id={errorId}>
          <ErrorAlert error={error} />
        </div>
      </form>

      {hasResult && result ? (
        <OutputPanel
          text={result.output.text}
          value={exportValue}
          filename={`${manifest.slug}-validated`}
          title="Result"
          meta={
            <p className="text-xs text-muted-foreground">
              Valid JSON · {result.output.entries.toLocaleString()}{" "}
              {result.output.entries === 1 ? "top-level entry" : "top-level entries"} ·{" "}
              {result.output.bytes.toLocaleString()} bytes ·{" "}
              {result.metrics.processingMs.toFixed(1)} ms
            </p>
          }
        />
      ) : null}
    </div>
  )
}
