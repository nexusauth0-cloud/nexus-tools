"use client"

import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CodeEditor } from "@/components/tool/inputs/code-editor"
import { CodeBlock } from "@/components/tool/outputs/code-block"
import { CopyButton } from "@/components/tool/outputs/copy-button"
import { ErrorAlert } from "@/components/tool/outputs/error-alert"
import { OutputPanel } from "@/components/tool/outputs/output-panel"
import { ResetButton } from "@/components/tool/outputs/reset-button"
import { Segmented, type SegmentedOption } from "@/components/tool/inputs/segmented"
import { useTool } from "@/lib/tool-engine"
import { currentTimestamp, timestampConverterEngine, type TimestampMode } from "./engine"
import { manifest } from "./manifest"

const MODE_OPTIONS: SegmentedOption<TimestampMode>[] = [
  { value: "seconds", label: "Unix seconds" },
  { value: "milliseconds", label: "Unix ms" },
  { value: "iso", label: "ISO 8601" },
]

const ROW_LABELS: Record<string, string> = {
  unixSeconds: "Unix seconds (10 digits)",
  unixMilliseconds: "Unix milliseconds (13 digits)",
  isoUtc: "ISO 8601 (UTC)",
  isoLocal: "ISO 8601 (local)",
  localLabel: "Human-readable local",
}

export default function TimestampConverter() {
  const [mode, setMode] = useState<TimestampMode>("seconds")
  const [value, setValue] = useState("")

  const { status, result, error, run, reset } = useTool(timestampConverterEngine)

  const busy = status === "validating" || status === "processing"
  const hasResult = result !== null
  const errorId = `${manifest.slug}-error`

  const handleRun = () => {
    void run({ mode, value })
  }

  const handleNow = () => {
    const now = currentTimestamp(mode)
    setValue(now)
    void run({ mode, value: now })
  }

  const handleReset = () => {
    reset()
    setValue("")
    setMode("seconds")
  }

  const formatted = useMemo(() => {
    if (!result) return undefined
    const output = result.output
    return {
      timezone: output.timezone,
      localLabel: output.localLabel,
      isoUtc: output.isoUtc,
      isoLocal: output.isoLocal,
      unixSeconds: String(output.unixSeconds),
      unixMilliseconds: String(output.unixMilliseconds),
    }
  }, [result])

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <form
        onSubmit={(event) => {
          event.preventDefault()
          handleRun()
        }}
        className="flex flex-col gap-5"
        noValidate
        aria-label="Timestamp input form"
      >
        <Segmented label="Input format" options={MODE_OPTIONS} value={mode} onChange={setMode} />

        <div className="flex flex-col gap-2">
          <label htmlFor={`${manifest.slug}-value`} className="text-sm font-medium">
            {mode === "iso"
              ? "ISO 8601 date-time"
              : mode === "seconds"
                ? "Unix seconds"
                : "Unix milliseconds"}
          </label>
          <CodeEditor
            id={`${manifest.slug}-value`}
            label=""
            placeholder={mode === "iso" ? "2025-08-08T00:00:00.000Z" : "1700000000"}
            value={value}
            onChange={(event) => setValue(event.target.value)}
            showCount
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? errorId : undefined}
          />
          <p className="text-xs text-muted-foreground">
            {mode === "iso"
              ? "Any ISO 8601 date-time, with or without an offset."
              : mode === "seconds"
                ? "Seconds since the Unix epoch (1970-01-01T00:00:00Z), e.g. 1700000000."
                : "Milliseconds since the Unix epoch, e.g. 1700000000000."}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={busy || value.trim() === ""}>
            {busy ? "Converting…" : "Convert"}
          </Button>
          <Button type="button" variant="outline" onClick={handleNow} disabled={busy}>
            Use current time
          </Button>
          <ResetButton
            onClick={handleReset}
            disabled={busy || (!value && !hasResult && mode === "seconds")}
          />
        </div>

        <div id={errorId}>
          <ErrorAlert error={error} />
        </div>
      </form>

      {hasResult && result && formatted ? (
        <div className="flex flex-col gap-6">
          <OutputPanel
            text={formatted.localLabel}
            value={formatted}
            filename={`${manifest.slug}-${result.output.unixSeconds}`}
            title="Converted timestamp"
            meta={
              <p className="text-xs text-muted-foreground">
                Timezone shown explicitly:{" "}
                <span className="font-mono">{result.output.timezone}</span>
                {result.output.isUtc ? " (UTC)" : ""} · {result.metrics.processingMs.toFixed(1)} ms
              </p>
            }
          />

          <Card>
            <CardHeader>
              <CardTitle className="text-base">All representations</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="flex flex-col gap-3">
                {Object.entries(formatted).map(([key, text]) => (
                  <li
                    key={key}
                    className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <span className="text-xs font-medium text-muted-foreground sm:w-56">
                      {ROW_LABELS[key] ?? key}
                    </span>
                    <div className="flex min-w-0 flex-1 items-center gap-2">
                      <CodeBlock className="flex-1" maxHeight={48}>
                        {text}
                      </CodeBlock>
                      <CopyButton text={text} label="Copy" />
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  )
}
