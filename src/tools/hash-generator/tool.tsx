"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { CodeEditor } from "@/components/tool/inputs/code-editor"
import { Segmented, type SegmentedOption } from "@/components/tool/inputs/segmented"
import { ErrorAlert } from "@/components/tool/outputs/error-alert"
import { OutputPanel } from "@/components/tool/outputs/output-panel"
import { ResetButton } from "@/components/tool/outputs/reset-button"
import { useTool } from "@/lib/tool-engine"
import { algorithmLabel, hashGeneratorEngine, legacyAlgorithm, type HashAlgorithm } from "./engine"
import { manifest } from "./manifest"

const ALGORITHM_OPTIONS: SegmentedOption<HashAlgorithm>[] = [
  { value: "sha256", label: "SHA-256" },
  { value: "sha512", label: "SHA-512" },
  { value: "sha384", label: "SHA-384" },
  { value: "sha1", label: "SHA-1 · legacy" },
  { value: "md5", label: "MD5 · legacy" },
]

export default function HashGenerator() {
  const [text, setText] = useState("")
  const [algorithm, setAlgorithm] = useState<HashAlgorithm>("sha256")

  const { status, result, error, run, reset } = useTool(hashGeneratorEngine)

  const busy = status === "validating" || status === "processing"
  const hasResult = result !== null
  const errorId = `${manifest.slug}-error`

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    void run({ algorithm, text })
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
      event.preventDefault()
      void run({ algorithm, text })
    }
  }

  const handleReset = () => {
    reset()
    setText("")
    setAlgorithm("sha256")
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-5"
        noValidate
        aria-label="Hash generator form"
      >
        <CodeEditor
          id={`${manifest.slug}-input`}
          label="Text to hash"
          placeholder="Paste the text you want to digest…"
          value={text}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={handleKeyDown}
          showCount
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
        />

        <div className="flex flex-col gap-2">
          <Segmented
            label="Algorithm"
            options={ALGORITHM_OPTIONS}
            value={algorithm}
            onChange={setAlgorithm}
          />
          {legacyAlgorithm(algorithm) ? (
            <p
              className="text-xs text-amber-600 dark:text-amber-500"
              id={`${manifest.slug}-legacy-note`}
            >
              {algorithmLabel(algorithm)} is broken for security-sensitive use. Only use it for
              legacy compatibility — never for passwords or signatures.
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              {algorithmLabel(algorithm)} via the browser&apos;s Web Crypto API.
            </p>
          )}
        </div>

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={busy || text.trim() === ""}>
            {busy ? "Hashing…" : "Generate hash"}
          </Button>
          <ResetButton
            onClick={handleReset}
            disabled={busy || (!text && !hasResult && algorithm === "sha256")}
          />
        </div>

        <div id={errorId}>
          <ErrorAlert error={error} />
        </div>
      </form>

      {hasResult && result ? (
        <OutputPanel
          text={result.output.hex}
          title={`${algorithmLabel(result.output.algorithm)} digest`}
          filename={`${manifest.slug}-${result.output.algorithm}`}
          meta={
            <p className="text-xs text-muted-foreground">
              {algorithmLabel(result.output.algorithm)} · {result.output.bytes.toLocaleString()}{" "}
              {result.output.bytes === 1 ? "byte" : "bytes"} input ·{" "}
              {result.metrics.processingMs.toFixed(1)} ms
            </p>
          }
        />
      ) : null}
    </div>
  )
}
