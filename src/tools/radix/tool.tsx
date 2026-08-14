"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { CodeEditor } from "@/components/tool/inputs/code-editor"
import { ErrorAlert } from "@/components/tool/outputs/error-alert"
import { ResetButton } from "@/components/tool/outputs/reset-button"
import { CodeBlock } from "@/components/tool/outputs/code-block"
import { CopyButton } from "@/components/tool/outputs/copy-button"
import { useTool } from "@/lib/tool-engine"
import { radixEngine } from "./engine"
import { manifest } from "./manifest"

export default function NumberBaseConverter() {
  const [number, setNumber] = useState("")

  const { status, result, error, run, reset } = useTool(radixEngine)

  const hasResult = result !== null
  const busy = status === "validating" || status === "processing"
  const errorId = `${manifest.slug}-error`

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    void run({ number })
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
      event.preventDefault()
      void run({ number })
    }
  }

  const handleReset = () => {
    reset()
    setNumber("")
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-5"
        noValidate
        aria-label="Number base conversion form"
      >
        <CodeEditor
          id={`${manifest.slug}-input`}
          label="Number"
          placeholder="e.g. 255, ff, 0b1010, zz"
          value={number}
          onChange={(event) => setNumber(event.target.value)}
          onKeyDown={handleKeyDown}
          showCount
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
        />

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={busy || number.trim() === ""}>
            {busy ? "Converting…" : "Convert"}
          </Button>
          <ResetButton onClick={handleReset} disabled={busy || (!number && !hasResult)} />
        </div>

        <div id={errorId}>
          <ErrorAlert error={error} />
        </div>
      </form>

      {hasResult && result ? (
        <div className="flex flex-col gap-4">
          <p className="text-xs text-muted-foreground">
            Decimal {result.output.decimal} · {result.output.reason}
          </p>
          {result.output.blocks.map((block, index) => (
            <div key={`${block.label}-${index}`} className="flex flex-col gap-2">
              <p className="text-sm font-medium text-foreground">{block.label}</p>
              <div className="relative">
                <CodeBlock className="max-h-96 overflow-auto">{block.text}</CodeBlock>
                <CopyButton text={block.text} className="absolute right-2 top-2" />
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  )
}
