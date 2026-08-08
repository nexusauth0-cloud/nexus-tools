"use client"

import { useMemo, useState } from "react"
import { ConverterTool } from "@/components/tool/converter-tool"
import { useTool } from "@/lib/tool-engine"
import { htmlEntityEncoderEngine, type HtmlMode } from "./engine"
import { manifest } from "./manifest"

const MODES = [
  { value: "encode" as const, label: "Encode" },
  { value: "decode" as const, label: "Decode" },
]

export default function HtmlEntityEncoder() {
  const [input, setInput] = useState("")
  const [mode, setMode] = useState<HtmlMode>("encode")

  const { status, result, error, run, reset } = useTool(htmlEntityEncoderEngine)

  const busy = status === "validating" || status === "processing"
  const hasResult = result !== null

  const resultPanel = useMemo(() => {
    if (!result) return null
    return {
      text: result.output.text,
      filename: `${manifest.slug}-${result.output.mode}`,
      meta: (
        <p className="text-xs text-muted-foreground">
          {result.output.replacements.toLocaleString()}{" "}
          {result.output.replacements === 1 ? "change" : "changes"} ·{" "}
          {result.output.bytes.toLocaleString()} bytes · {result.metrics.processingMs.toFixed(1)} ms
        </p>
      ),
    }
  }, [result])

  const handleRun = () => {
    void run({ input, mode })
  }

  const handleReset = () => {
    reset()
    setInput("")
    setMode("encode")
  }

  return (
    <ConverterTool
      slug={manifest.slug}
      inputLabel="HTML or text"
      inputPlaceholder={
        mode === "encode" ? "Text with < > & \" ' to escape…" : "Entities to unescape…"
      }
      modes={MODES}
      mode={mode}
      onModeChange={setMode}
      input={input}
      onInputChange={setInput}
      busy={busy}
      canRun={input.trim() !== ""}
      error={error}
      onRun={handleRun}
      onReset={handleReset}
      hasResult={hasResult}
      result={resultPanel}
    />
  )
}
