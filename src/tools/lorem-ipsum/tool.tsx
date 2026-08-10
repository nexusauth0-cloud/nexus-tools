"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Segmented, type SegmentedOption } from "@/components/tool/inputs/segmented"
import { ErrorAlert } from "@/components/tool/outputs/error-alert"
import { OutputPanel } from "@/components/tool/outputs/output-panel"
import { ResetButton } from "@/components/tool/outputs/reset-button"
import { useTool } from "@/lib/tool-engine"
import {
  LOREM_DEFAULT_SEED,
  LOREM_MAX,
  randomSeed,
  type LoremFormat,
  type LoremMode,
} from "@/lib/text/lorem"
import { loremIpsumEngine, loremIpsumSummarize } from "./engine"
import { manifest } from "./manifest"

const MODE_OPTIONS: SegmentedOption<LoremMode>[] = [
  { value: "paragraphs", label: "Paragraphs" },
  { value: "sentences", label: "Sentences" },
  { value: "words", label: "Words" },
]

const FORMAT_OPTIONS: SegmentedOption<LoremFormat>[] = [
  { value: "plain", label: "Plain text" },
  { value: "markdown", label: "Markdown" },
  { value: "html", label: "HTML" },
]

const MAX_LOREM = Math.max(...Object.values(LOREM_MAX))

/**
 * Lorem Ipsum generator — deterministic seeded output. Same seed, same
 * text; "Randomize" picks a fresh seed. Quantities are capped at the
 * documented per-mode maximums.
 */
export default function LoremIpsum() {
  const [mode, setMode] = useState<LoremMode>("paragraphs")
  const [quantity, setQuantity] = useState("3")
  const [format, setFormat] = useState<LoremFormat>("plain")
  const [startWithClassic, setStartWithClassic] = useState(true)
  const [seed, setSeed] = useState("")

  const { status, result, error, run, reset } = useTool(loremIpsumEngine, {
    summarize: loremIpsumSummarize,
  })

  const busy = status === "validating" || status === "processing"
  const errorId = `${manifest.slug}-error`
  const parsedQuantity = Number(quantity)
  const parsedSeed = seed === "" ? undefined : Number(seed)
  const canRun =
    Number.isInteger(parsedQuantity) &&
    parsedQuantity >= 1 &&
    parsedQuantity <= LOREM_MAX[mode] &&
    (parsedSeed === undefined || Number.isInteger(parsedSeed))

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (canRun) {
      void run({
        mode,
        quantity: parsedQuantity,
        format,
        startWithClassic,
        seed: parsedSeed ?? LOREM_DEFAULT_SEED,
      })
    }
  }

  const handleRandomizeSeed = () => {
    setSeed(String(randomSeed()))
  }

  const handleReset = () => {
    reset()
    setMode("paragraphs")
    setQuantity("3")
    setFormat("plain")
    setStartWithClassic(true)
    setSeed("")
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-5"
        noValidate
        aria-label="Lorem ipsum generator form"
      >
        <Segmented label="Mode" options={MODE_OPTIONS} value={mode} onChange={setMode} />

        <div className="flex flex-col gap-2">
          <Label htmlFor={`${manifest.slug}-quantity`}>Quantity</Label>
          <Input
            id={`${manifest.slug}-quantity`}
            type="number"
            min={1}
            max={MAX_LOREM}
            inputMode="numeric"
            value={quantity}
            onChange={(event) => setQuantity(event.target.value)}
            aria-describedby={`${manifest.slug}-quantity-hint`}
            className="w-full sm:w-40"
          />
          <p id={`${manifest.slug}-quantity-hint`} className="text-xs text-muted-foreground">
            Maximum: {LOREM_MAX[mode].toLocaleString()} per run ({mode}).
          </p>
        </div>

        <Segmented label="Format" options={FORMAT_OPTIONS} value={format} onChange={setFormat} />

        <div className="flex items-center justify-between gap-4 rounded-lg border border-border bg-background/60 p-3">
          <div className="flex flex-col gap-1">
            <Label htmlFor={`${manifest.slug}-classic`}>Start with the classic passage</Label>
            <p className="text-xs text-muted-foreground">
              Prepend “Lorem ipsum dolor sit amet…”, then continue with generated text.
            </p>
          </div>
          <Switch
            id={`${manifest.slug}-classic`}
            checked={startWithClassic}
            onCheckedChange={setStartWithClassic}
          />
        </div>

        <div className="flex items-end gap-3">
          <div className="flex flex-col gap-2">
            <Label htmlFor={`${manifest.slug}-seed`}>Seed (optional)</Label>
            <Input
              id={`${manifest.slug}-seed`}
              type="number"
              min={0}
              inputMode="numeric"
              placeholder="random"
              value={seed}
              onChange={(event) => setSeed(event.target.value)}
              className="w-full sm:w-40"
            />
          </div>
          <Button type="button" variant="outline" onClick={handleRandomizeSeed}>
            Randomize seed
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          The same seed always produces the same text — handy for stable placeholders.
        </p>

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={busy || !canRun}>
            {busy ? "Generating…" : "Generate"}
          </Button>
          <ResetButton
            onClick={handleReset}
            disabled={busy || (quantity === "3" && seed === "" && !result)}
          />
        </div>

        <div id={errorId}>
          <ErrorAlert error={error} />
        </div>
      </form>

      {result ? (
        <OutputPanel
          text={result.output.text}
          filename={`${manifest.slug}-${mode}-${result.output.seed}`}
          title="Generated text"
          meta={
            <p className="text-xs text-muted-foreground">
              {result.output.wordCount.toLocaleString()} words · seed {result.output.seed} ·{" "}
              {result.metrics.processingMs.toFixed(1)} ms
            </p>
          }
        />
      ) : (
        <div className="flex items-center justify-center rounded-xl border border-dashed border-border p-12 text-sm text-muted-foreground">
          Generated placeholder text appears here. It is placeholder text, not meaningful copy.
        </div>
      )}
    </div>
  )
}
