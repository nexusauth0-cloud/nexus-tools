"use client"

import { useMemo, useState, type ChangeEvent } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { CodeBlock } from "@/components/tool/outputs/code-block"
import { CopyButton } from "@/components/tool/outputs/copy-button"
import { ErrorAlert } from "@/components/tool/outputs/error-alert"
import { OutputPanel } from "@/components/tool/outputs/output-panel"
import { ResetButton } from "@/components/tool/outputs/reset-button"
import { useTool } from "@/lib/tool-engine"
import { uuidGeneratorEngine } from "./engine"
import { manifest } from "./manifest"

function clampCount(value: number): number {
  if (Number.isNaN(value)) return 1
  return Math.min(100, Math.max(1, Math.round(value)))
}

export default function UuidGenerator() {
  const [count, setCount] = useState("5")
  const [hyphens, setHyphens] = useState(true)
  const [uppercase, setUppercase] = useState(false)

  const { status, result, error, run, reset } = useTool(uuidGeneratorEngine)

  const busy = status === "validating" || status === "processing"
  const hasResult = result !== null
  const errorId = `${manifest.slug}-error`

  const handleCountChange = (event: ChangeEvent<HTMLInputElement>) => {
    setCount(event.target.value)
  }

  const handleGenerate = () => {
    const countValue = clampCount(Number(count))
    setCount(String(countValue))
    void run({ count: countValue, hyphens, uppercase })
  }

  const handleReset = () => {
    reset()
    setCount("5")
    setHyphens(true)
    setUppercase(false)
  }

  const outputValue = useMemo(() => (result ? result.output.items : undefined), [result])

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="h-fit">
        <CardHeader>
          <CardTitle className="text-base">Options</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <Label htmlFor={`${manifest.slug}-count`} className="text-sm font-medium">
              How many UUIDs to generate
            </Label>
            <Input
              id={`${manifest.slug}-count`}
              type="number"
              inputMode="numeric"
              min={1}
              max={100}
              value={count}
              onChange={handleCountChange}
              className="w-32"
              aria-label="Number of UUIDs (1–100)"
            />
            <p className="text-xs text-muted-foreground">Between 1 and 100.</p>
          </div>

          <div className="flex items-center justify-between gap-4">
            <Label htmlFor={`${manifest.slug}-hyphens`} className="text-sm font-medium">
              Include hyphens
            </Label>
            <Switch
              id={`${manifest.slug}-hyphens`}
              checked={hyphens}
              onCheckedChange={setHyphens}
              aria-label="Include hyphens"
            />
          </div>

          <div className="flex items-center justify-between gap-4">
            <Label htmlFor={`${manifest.slug}-uppercase`} className="text-sm font-medium">
              Uppercase
            </Label>
            <Switch
              id={`${manifest.slug}-uppercase`}
              checked={uppercase}
              onCheckedChange={setUppercase}
              aria-label="Uppercase output"
            />
          </div>

          <div className="flex items-center gap-3">
            <Button type="button" onClick={handleGenerate} disabled={busy}>
              {busy ? "Generating…" : "Generate"}
            </Button>
            <ResetButton onClick={handleReset} disabled={busy || (!hasResult && count === "5")} />
          </div>

          <div id={errorId}>
            <ErrorAlert error={error} />
          </div>
        </CardContent>
      </Card>

      {hasResult && result ? (
        <div className="flex flex-col gap-6">
          <OutputPanel
            text={result.output.text}
            value={outputValue}
            filename={`${manifest.slug}-v4`}
            title="All UUIDs"
            meta={
              <p className="text-xs text-muted-foreground">
                {result.output.count.toLocaleString()}{" "}
                {result.output.count === 1 ? "UUID" : "UUIDs"} ·{" "}
                {result.output.bytes.toLocaleString()} bytes ·{" "}
                {result.metrics.processingMs.toFixed(1)} ms
              </p>
            }
          />

          {result.output.items.length > 1 ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Copy individually</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="flex flex-col gap-2">
                  {result.output.items.map((uuid, index) => (
                    <li key={uuid + index} className="flex items-center justify-between gap-3">
                      <CodeBlock className="flex-1" maxHeight={40}>
                        {uuid}
                      </CodeBlock>
                      <CopyButton text={uuid} label="Copy" />
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
