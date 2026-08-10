"use client"

import { useDeferredValue, useEffect, useMemo, useState } from "react"
import { CodeEditor } from "@/components/tool/inputs/code-editor"
import { ErrorAlert } from "@/components/tool/outputs/error-alert"
import { ResetButton } from "@/components/tool/outputs/reset-button"
import { ResultCard } from "@/components/tool/outputs/result-card"
import { TextStats } from "@/components/tool/outputs/text-stats"
import { useTool } from "@/lib/tool-engine"
import { markdownToHtml } from "@/lib/text/markdown"
import { analyzeText } from "@/lib/text/stats"
import { markdownPreviewEngine, markdownPreviewSummarize } from "./engine"
import { manifest } from "./manifest"

const PREVIEW_STYLES = [
  "[&_h1]:mb-3 [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:tracking-tight",
  "[&_h2]:mb-2 [&_h2]:text-xl [&_h2]:font-semibold",
  "[&_h3]:mb-2 [&_h3]:text-lg [&_h3]:font-semibold",
  "[&_h4]:mb-2 [&_h4]:text-base [&_h4]:font-semibold",
  "[&_h5]:mb-1 [&_h5]:text-sm [&_h5]:font-semibold",
  "[&_h6]:mb-1 [&_h6]:text-sm [&_h6]:font-medium [&_h6]:text-muted-foreground",
  "[&_p]:mb-3 [&_p:last-child]:mb-0",
  "[&_ul]:mb-3 [&_ul]:list-disc [&_ul]:pl-5",
  "[&_ol]:mb-3 [&_ol]:list-decimal [&_ol]:pl-5",
  "[&_li]:mb-1",
  "[&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2",
  "[&_blockquote]:mb-3 [&_blockquote]:border-l-2 [&_blockquote]:border-border [&_blockquote]:pl-4 [&_blockquote]:text-muted-foreground",
  "[&_pre]:mb-3 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-surface [&_pre]:p-3 [&_pre]:font-mono [&_pre]:text-xs",
  "[&_code]:rounded [&_code]:bg-surface [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[0.85em]",
  "[&_pre_code]:bg-transparent [&_pre_code]:p-0",
  "[&_img]:max-w-full [&_img]:rounded-lg",
  "[&_hr]:my-4 [&_hr]:border-border",
  "[&_table]:mb-3 [&_table]:w-full [&_table]:border-collapse [&_table]:text-sm",
  "[&_th]:border [&_th]:border-border [&_th]:bg-surface [&_th]:px-3 [&_th]:py-1.5 [&_th]:text-left [&_th]:font-semibold",
  "[&_td]:border [&_td]:border-border [&_td]:px-3 [&_td]:py-1.5",
  "[&_del]:text-muted-foreground [&_del]:line-through",
].join(" ")

/**
 * Live markdown previewer — the right pane renders the engine's HTML
 * output with dangerouslySetInnerHTML, which is safe here because the
 * renderer escapes every input character by construction; preview HTML is
 * never user-authored.
 */
export default function MarkdownPreview() {
  const [input, setInput] = useState("")
  const deferredInput = useDeferredValue(input)
  const liveHtml = useMemo(() => markdownToHtml(deferredInput), [deferredInput])
  const liveStats = useMemo(() => analyzeText(deferredInput), [deferredInput])

  const { status, result, error, run, reset } = useTool(markdownPreviewEngine, {
    summarize: markdownPreviewSummarize,
  })

  const busy = status === "validating" || status === "processing"
  const errorId = `${manifest.slug}-error`
  const html = result?.output.html ?? liveHtml
  const stats = result?.output.stats ?? liveStats

  useEffect(() => {
    if (deferredInput === "") return
    const timer = setTimeout(() => {
      void run({ input: deferredInput })
    }, 350)
    return () => clearTimeout(timer)
  }, [deferredInput, run])

  const handleReset = () => {
    reset()
    setInput("")
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <CodeEditor
          id={`${manifest.slug}-input`}
          label="Markdown source"
          placeholder={"# Heading\n\nWrite **markdown** here…"}
          value={input}
          onChange={(event) => setInput(event.target.value)}
          showCount
          className="min-h-64"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
        />
        <div className="mt-2 flex items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            Live preview — updates as you type. HTML output is escaped and safe by construction.
          </p>
          <ResetButton onClick={handleReset} disabled={busy || (!input && !result)} />
        </div>
        <div id={errorId} className="mt-3">
          <ErrorAlert error={error} />
        </div>
      </div>

      <ResultCard title="Preview" className="h-fit">
        {deferredInput === "" ? (
          <div className="flex items-center justify-center rounded-xl border border-dashed border-border p-12 text-sm text-muted-foreground">
            The rendered preview appears here as you type.
          </div>
        ) : (
          <>
            <div
              className={`rounded-lg border border-border bg-background/60 p-4 text-sm leading-relaxed text-foreground ${PREVIEW_STYLES}`}
              dangerouslySetInnerHTML={{ __html: html }}
            />
            {result ? (
              <p className="mt-3 text-xs text-muted-foreground">
                Rendered in {result.metrics.processingMs.toFixed(1)} ms · raw HTML never enters the
                page except through this escaped output.
              </p>
            ) : null}
          </>
        )}
      </ResultCard>

      <ResultCard title="Document statistics">
        <TextStats stats={stats} />
      </ResultCard>
    </div>
  )
}
