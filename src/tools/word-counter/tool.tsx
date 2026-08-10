"use client"

import { useDeferredValue, useEffect, useMemo, useState } from "react"
import { CodeEditor } from "@/components/tool/inputs/code-editor"
import { ErrorAlert } from "@/components/tool/outputs/error-alert"
import { ResetButton } from "@/components/tool/outputs/reset-button"
import { ResultCard } from "@/components/tool/outputs/result-card"
import { TextStats } from "@/components/tool/outputs/text-stats"
import { useTool } from "@/lib/tool-engine"
import {
  analyzeText,
  formatDuration,
  readingTimeSeconds,
  speakingTimeSeconds,
} from "@/lib/text/stats"
import { wordCounterEngine, wordCounterSummarize } from "./engine"
import { manifest } from "./manifest"

/**
 * Live word & character counter — statistics update as you type; the
 * engine run (debounced) also feeds history, metrics, and analytics.
 */
export default function WordCounter() {
  const [input, setInput] = useState("")
  const deferredInput = useDeferredValue(input)
  const liveStats = useMemo(() => analyzeText(deferredInput), [deferredInput])

  const { status, result, error, run, reset } = useTool(wordCounterEngine, {
    summarize: wordCounterSummarize,
  })

  const busy = status === "validating" || status === "processing"
  const errorId = `${manifest.slug}-error`

  useEffect(() => {
    if (deferredInput === "") return
    const timer = setTimeout(() => {
      void run({ input: deferredInput })
    }, 350)
    return () => clearTimeout(timer)
  }, [deferredInput, run])

  const stats = result?.output.stats ?? liveStats
  const readingTime = result
    ? result.output.readingTime
    : formatDuration(readingTimeSeconds(liveStats.words))
  const speakingTime = result
    ? result.output.speakingTime
    : formatDuration(speakingTimeSeconds(liveStats.words))

  const handleReset = () => {
    reset()
    setInput("")
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <CodeEditor
          id={`${manifest.slug}-input`}
          label="Your text"
          placeholder="Type or paste text to count…"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          showCount
          className="min-h-64"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
        />
        <div className="mt-2 flex items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            Statistics update live as you type — no run button needed.
          </p>
          <ResetButton onClick={handleReset} disabled={busy || (!input && !result)} />
        </div>
        <div id={errorId} className="mt-3">
          <ErrorAlert error={error} />
        </div>
      </div>

      <ResultCard title="Statistics">
        <TextStats stats={stats} />
        <div className="mt-3 flex flex-wrap gap-3">
          <div className="rounded-lg border border-border bg-background/60 px-3 py-2 text-sm">
            <span className="text-muted-foreground">Reading time: </span>
            <span className="font-semibold tabular-nums">{readingTime}</span>
            <span className="ml-1 text-xs text-muted-foreground">(est.)</span>
          </div>
          <div className="rounded-lg border border-border bg-background/60 px-3 py-2 text-sm">
            <span className="text-muted-foreground">Speaking time: </span>
            <span className="font-semibold tabular-nums">{speakingTime}</span>
            <span className="ml-1 text-xs text-muted-foreground">(est.)</span>
          </div>
        </div>
        {result ? (
          <p className="mt-3 text-xs text-muted-foreground">
            Ran in {result.metrics.processingMs.toFixed(1)} ms.
          </p>
        ) : null}
      </ResultCard>
    </div>
  )
}
