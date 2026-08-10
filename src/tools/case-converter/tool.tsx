"use client"

import { useDeferredValue, useEffect, useMemo, useState } from "react"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { CodeEditor } from "@/components/tool/inputs/code-editor"
import { ErrorAlert } from "@/components/tool/outputs/error-alert"
import { OutputPanel } from "@/components/tool/outputs/output-panel"
import { ResetButton } from "@/components/tool/outputs/reset-button"
import { useTool } from "@/lib/tool-engine"
import { applyCase, CASE_MODE_LABELS, CASE_MODES, type CaseMode } from "@/lib/text/cases"
import { caseConverterEngine, caseConverterSummarize } from "./engine"
import { manifest } from "./manifest"

/**
 * Live case converter — the converted text updates as you type; the
 * engine run (debounced) also feeds history, metrics, and analytics.
 */
export default function CaseConverter() {
  const [input, setInput] = useState("")
  const [mode, setMode] = useState<CaseMode>("lower")
  const deferredInput = useDeferredValue(input)
  const preview = useMemo(() => applyCase(mode, deferredInput), [mode, deferredInput])

  const { status, result, error, run, reset } = useTool(caseConverterEngine, {
    summarize: caseConverterSummarize,
  })

  const busy = status === "validating" || status === "processing"
  const errorId = `${manifest.slug}-error`

  useEffect(() => {
    if (deferredInput === "") return
    const timer = setTimeout(() => {
      void run({ input: deferredInput, mode })
    }, 350)
    return () => clearTimeout(timer)
  }, [deferredInput, mode, run])

  const outputText = result?.output.text ?? (deferredInput === "" ? "" : preview)

  const handleReset = () => {
    reset()
    setInput("")
    setMode("lower")
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="flex flex-col gap-5">
        <CodeEditor
          id={`${manifest.slug}-input`}
          label="Text to convert"
          placeholder="Type or paste text to change its case…"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          showCount
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
        />

        <div className="flex flex-col gap-2">
          <Label htmlFor={`${manifest.slug}-mode`}>Case style</Label>
          <Select value={mode} onValueChange={(value) => setMode(value as CaseMode)}>
            <SelectTrigger id={`${manifest.slug}-mode`} className="w-full sm:w-64">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CASE_MODES.map((option) => (
                <SelectItem key={option} value={option}>
                  {CASE_MODE_LABELS[option]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-3">
          <ResetButton onClick={handleReset} disabled={busy || (!input && !result)} />
        </div>

        <div id={errorId}>
          <ErrorAlert error={error} />
        </div>
      </div>

      {outputText !== "" ? (
        <OutputPanel
          text={outputText}
          filename={`${manifest.slug}-${mode}`}
          title="Converted text"
          meta={
            <p className="text-xs text-muted-foreground">
              {CASE_MODE_LABELS[mode]} · {result?.output.words ?? 0}{" "}
              {result?.output.words === 1 ? "word" : "words"} ·{" "}
              {result ? `${result.metrics.processingMs.toFixed(1)} ms` : "live preview"}
            </p>
          }
        />
      ) : (
        <div className="flex items-center justify-center rounded-xl border border-dashed border-border p-12 text-sm text-muted-foreground">
          The converted text appears here.
        </div>
      )}
    </div>
  )
}
