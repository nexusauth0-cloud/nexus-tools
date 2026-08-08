"use client"

import { useMemo, useState } from "react"
import { ConverterTool } from "@/components/tool/converter-tool"
import { useTool } from "@/lib/tool-engine"
import { base64EncoderEngine, type Base64Mode } from "./engine"
import { manifest } from "./manifest"

const MODES = [
  { value: "encode" as const, label: "Encode" },
  { value: "decode" as const, label: "Decode" },
]

export default function Base64Encoder() {
  const [input, setInput] = useState("")
  const [mode, setMode] = useState<Base64Mode>("encode")

  const { status, result, error, run, reset } = useTool(base64EncoderEngine)

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
            ? `Encoded to ${result.output.text.length} base64 characters`
            : `Decoded ${result.output.bytes} bytes of UTF-8 text`}{" "}
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
      inputLabel="Text or base64"
      inputPlaceholder={mode === "encode" ? "Text to encode (Unicode-safe)…" : "Base64 to decode…"}
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
