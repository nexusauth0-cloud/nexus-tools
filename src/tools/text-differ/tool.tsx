"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { CodeEditor } from "@/components/tool/inputs/code-editor"
import { DiffViewer } from "@/components/tool/outputs/diff-viewer"
import { ErrorAlert } from "@/components/tool/outputs/error-alert"
import { ResetButton } from "@/components/tool/outputs/reset-button"
import { ResultCard } from "@/components/tool/outputs/result-card"
import { useTool } from "@/lib/tool-engine"
import { textDiffEngine, textDiffSummarize } from "./engine"
import { manifest } from "./manifest"

/**
 * Line-by-line diff checker: two textareas compared with the shared
 * Myers O(ND) engine. The result view renders from the engine output
 * only — plain text, never parsed or executed.
 */
export default function TextDiffer() {
  const [original, setOriginal] = useState("")
  const [modified, setModified] = useState("")

  const { status, result, error, run, reset } = useTool(textDiffEngine, {
    summarize: textDiffSummarize,
  })

  const busy = status === "validating" || status === "processing"
  const errorId = `${manifest.slug}-error`
  const canRun = original.trim() !== "" && modified.trim() !== ""

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    void run({ original, modified })
  }

  const handleRun = () => {
    void run({ original, modified })
  }

  const handleReset = () => {
    reset()
    setOriginal("")
    setModified("")
  }

  const { diff } = result?.output ?? { diff: null }
  const diffStats = diff
    ? [
        { label: "Added", value: diff.added, tone: "text-emerald-600 dark:text-emerald-400" },
        { label: "Removed", value: diff.removed, tone: "text-red-600 dark:text-red-400" },
        { label: "Unchanged", value: diff.unchanged, tone: "text-muted-foreground" },
        { label: "Modified blocks", value: diff.modifiedBlocks, tone: "text-muted-foreground" },
      ]
    : []

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-5"
        noValidate
        aria-label="Diff checker form"
      >
        <CodeEditor
          id={`${manifest.slug}-original`}
          label="Original text"
          placeholder="Paste the first version…"
          value={original}
          onChange={(event) => setOriginal(event.target.value)}
          onKeyDown={(event) => {
            if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
              event.preventDefault()
              handleRun()
            }
          }}
          showCount
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
        />
        <CodeEditor
          id={`${manifest.slug}-modified`}
          label="Modified text"
          placeholder="Paste the second version…"
          value={modified}
          onChange={(event) => setModified(event.target.value)}
          onKeyDown={(event) => {
            if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
              event.preventDefault()
              handleRun()
            }
          }}
          showCount
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
        />
        <div className="flex items-center gap-3">
          <Button type="submit" disabled={busy || !canRun}>
            {busy ? "Comparing…" : "Compare"}
          </Button>
          <ResetButton
            onClick={handleReset}
            disabled={busy || (!original && !modified && !result)}
          />
        </div>
        <div id={errorId}>
          <ErrorAlert error={error} />
        </div>
      </form>

      <ResultCard title="Diff" className="h-fit">
        {result ? (
          <>
            <div className="mb-3 flex flex-wrap gap-2">
              {diffStats.map((stat) => (
                <span
                  key={stat.label}
                  className="rounded-lg border border-border bg-background/60 px-3 py-1.5 text-sm"
                >
                  <span className="text-muted-foreground">{stat.label}: </span>
                  <span className={`font-semibold tabular-nums ${stat.tone}`}>{stat.value}</span>
                </span>
              ))}
            </div>
            <DiffViewer diff={result.output.diff} />
            <p className="mt-3 text-xs text-muted-foreground">
              {result.output.diff.changed === 0
                ? "The texts are identical."
                : `${result.output.diff.changed} ${
                    result.output.diff.changed === 1 ? "line" : "lines"
                  } ${result.output.diff.changed === 1 ? "has" : "have"} changed`}{" "}
              · checked in {result.metrics.processingMs.toFixed(1)} ms
            </p>
          </>
        ) : (
          <div className="flex items-center justify-center rounded-xl border border-dashed border-border p-12 text-sm text-muted-foreground">
            The line-by-line diff appears here after comparing.
          </div>
        )}
      </ResultCard>
    </div>
  )
}
