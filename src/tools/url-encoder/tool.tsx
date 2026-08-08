"use client"

import { useMemo, useState } from "react"
import { ConverterTool } from "@/components/tool/converter-tool"
import { useTool } from "@/lib/tool-engine"
import { urlEncoderEngine, type UrlMode } from "./engine"
import { manifest } from "./manifest"

const MODES = [
  { value: "encode" as const, label: "Encode" },
  { value: "decode" as const, label: "Decode" },
]

export default function UrlEncoder() {
  const [input, setInput] = useState("")
  const [mode, setMode] = useState<UrlMode>("encode")

  const { status, result, error, run, reset } = useTool(urlEncoderEngine)

  const busy = status === "validating" || status === "processing"
  const hasResult = result !== null

  const resultPanel = useMemo(() => {
    if (!result) return null
    return {
      text: result.output.text,
      filename: `${manifest.slug}-${result.output.mode}`,
      meta: (
        <p className="text-xs text-muted-foreground">
          {result.output.mode === "encode"
            ? `${result.output.text.length} characters, percent-encoded`
            : `${result.output.text.length} characters, decoded`}{" "}
          · {result.metrics.processingMs.toFixed(1)} ms
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
      inputLabel="Text or URL component"
      inputPlaceholder={mode === "encode" ? "Text to percent-encode…" : "Percent-encoded URL…"}
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
