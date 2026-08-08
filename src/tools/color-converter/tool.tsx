"use client"

import { useDeferredValue, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CodeEditor } from "@/components/tool/inputs/code-editor"
import { CodeBlock } from "@/components/tool/outputs/code-block"
import { CopyButton } from "@/components/tool/outputs/copy-button"
import { ErrorAlert } from "@/components/tool/outputs/error-alert"
import { ResetButton } from "@/components/tool/outputs/reset-button"
import { useTool } from "@/lib/tool-engine"
import { parseColor, type RgbColor } from "@/lib/color"
import { colorConverterEngine } from "./engine"
import { manifest } from "./manifest"

const ROWS: Array<{ key: "hex" | "rgb" | "hsl" | "hsv" | "cmyk"; label: string }> = [
  { key: "hex", label: "HEX" },
  { key: "rgb", label: "RGB" },
  { key: "hsl", label: "HSL" },
  { key: "hsv", label: "HSV" },
  { key: "cmyk", label: "CMYK" },
]

export default function ColorConverter() {
  const [input, setInput] = useState("")
  const deferredInput = useDeferredValue(input)

  const { status, result, error, run, reset } = useTool(colorConverterEngine)

  const busy = status === "validating" || status === "processing"
  const hasResult = result !== null
  const errorId = `${manifest.slug}-error`

  const preview = useMemo(() => {
    if (deferredInput.trim() === "") return null
    const parsed = parseColor(deferredInput)
    if (parsed === null) return "invalid" as const
    const rgb = parsed.rgb
    return `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`
  }, [deferredInput])

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    void run({ color: input })
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
      event.preventDefault()
      void run({ color: input })
    }
  }

  const handleReset = () => {
    reset()
    setInput("")
  }

  const output = result?.output
  const previewStyle: RgbColor | null = output?.preview ?? null
  const previewCss = previewStyle
    ? `rgb(${previewStyle.r}, ${previewStyle.g}, ${previewStyle.b})`
    : preview !== null && preview !== "invalid"
      ? preview
      : null

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-5"
        noValidate
        aria-label="Color input form"
      >
        <CodeEditor
          id={`${manifest.slug}-input`}
          label="Color"
          placeholder="#ff6600 or rgb(255, 102, 0) or hsl(24, 100%, 50%)…"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={handleKeyDown}
          showCount={false}
          className="min-h-24"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
        />

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={busy || input.trim() === ""}>
            {busy ? "Converting…" : "Convert color"}
          </Button>
          <ResetButton onClick={handleReset} disabled={busy || (!input && !hasResult)} />
        </div>

        <div id={errorId}>
          <ErrorAlert error={error} />
        </div>
      </form>

      <div className="flex flex-col gap-6">
        <div
          className="h-24 w-full rounded-lg border border-border"
          style={
            previewCss
              ? { backgroundColor: previewCss }
              : { backgroundImage: "conic-gradient(#eee 25%, #fff 0 50%, #eee 0 75%, #fff 0)" }
          }
          role="img"
          aria-label={previewCss ? `Color preview ${previewCss}` : "Color preview"}
        />
        {preview === "invalid" ? (
          <p className="text-xs text-muted-foreground">Preview unavailable — invalid color.</p>
        ) : null}

        {output && hasResult ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">All formats</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="flex flex-col gap-3">
                {ROWS.map(({ key, label }) => (
                  <li
                    key={key}
                    className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <span className="text-xs font-medium text-muted-foreground sm:w-14">
                      {label}
                    </span>
                    <div className="flex min-w-0 flex-1 items-center gap-2">
                      <CodeBlock className="flex-1" maxHeight={12}>
                        {output[key]}
                      </CodeBlock>
                      <CopyButton text={output[key]} label="Copy" />
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  )
}
