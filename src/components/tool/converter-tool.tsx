"use client"

import type * as React from "react"
import { Button } from "@/components/ui/button"
import { CodeEditor } from "@/components/tool/inputs/code-editor"
import { Segmented, type SegmentedOption } from "@/components/tool/inputs/segmented"
import { ErrorAlert } from "@/components/tool/outputs/error-alert"
import { OutputPanel } from "@/components/tool/outputs/output-panel"
import { ResetButton } from "@/components/tool/outputs/reset-button"
import type { ToolExecutionError } from "@/lib/tool-engine"

export interface ConverterResult {
  text: string
  value?: unknown
  filename: string
  meta?: React.ReactNode
}

interface ConverterToolProps<Mode extends string> {
  slug: string
  inputLabel: string
  inputPlaceholder?: string
  modes: readonly SegmentedOption<Mode>[]
  mode: Mode
  onModeChange: (mode: Mode) => void
  input: string
  onInputChange: (value: string) => void
  busy: boolean
  canRun: boolean
  error: ToolExecutionError | null
  onRun: () => void
  onReset: () => void
  hasResult: boolean
  result?: ConverterResult | null
}

/**
 * Standard two-pane layout shared by the encode/decode developer tools:
 * input editor + mode selector on the left, result panel on the right.
 * Handles submission (incl. ⌘/Ctrl+Enter), errors, and reset consistently.
 */
export function ConverterTool<Mode extends string>({
  slug,
  inputLabel,
  inputPlaceholder,
  modes,
  mode,
  onModeChange,
  input,
  onInputChange,
  busy,
  canRun,
  error,
  onRun,
  onReset,
  hasResult,
  result,
}: ConverterToolProps<Mode>) {
  const errorId = `${slug}-error`

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    onRun()
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
      event.preventDefault()
      onRun()
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-5"
        noValidate
        aria-label={`${inputLabel} form`}
      >
        <CodeEditor
          id={`${slug}-input`}
          label={inputLabel}
          placeholder={inputPlaceholder}
          value={input}
          onChange={(event) => onInputChange(event.target.value)}
          onKeyDown={handleKeyDown}
          showCount
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
        />

        <Segmented label="Action" options={modes} value={mode} onChange={onModeChange} />

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={busy || !canRun}>
            {busy ? "Processing…" : "Run"}
          </Button>
          <ResetButton onClick={onReset} disabled={busy || (!input && !hasResult)} />
        </div>

        <div id={errorId}>
          <ErrorAlert error={error} />
        </div>
      </form>

      {result ? (
        <OutputPanel
          text={result.text}
          value={result.value}
          filename={result.filename}
          title="Result"
          meta={result.meta}
        />
      ) : null}
    </div>
  )
}
