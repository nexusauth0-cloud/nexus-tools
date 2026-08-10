"use client"

import { useId, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ErrorAlert } from "@/components/tool/outputs/error-alert"
import { ResetButton } from "@/components/tool/outputs/reset-button"
import { ResultCard } from "@/components/tool/outputs/result-card"
import { useTool } from "@/lib/tool-engine"
import { metaTagAnalyzerEngine, type MetaFlag } from "./engine"
import { manifest } from "./manifest"

function KindBadge({ kind }: { kind: MetaFlag["kind"] }) {
  if (kind === "pass") return <Badge variant="success">ok</Badge>
  if (kind === "warn") return <Badge variant="destructive">attention</Badge>
  return <Badge variant="secondary">note</Badge>
}

function Field({ label, value }: { label: string; value: string | number | null }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <span className="break-all text-sm" title={value === null ? undefined : String(value)}>
        {value === null ? <span className="italic text-muted-foreground">not present</span> : value}
      </span>
    </div>
  )
}

export default function MetaTagAnalyzerTool() {
  const [input, setInput] = useState("")
  const { status, result, error, run, reset } = useTool(metaTagAnalyzerEngine)

  const busy = status === "validating" || status === "processing"
  const hasResult = result !== null
  const errorId = useId()

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    void run({ url: input })
  }

  const handleReset = () => {
    reset()
    setInput("")
  }

  const output = result?.output
  const head = output?.analysis.head

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-5"
        noValidate
        aria-label="Meta tag analysis form"
      >
        <div className="flex flex-col gap-2">
          <Label htmlFor={`${manifest.slug}-input`}>Page URL</Label>
          <Input
            id={`${manifest.slug}-input`}
            type="url"
            inputMode="url"
            spellCheck={false}
            autoComplete="off"
            placeholder="https://example.com…"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? errorId : undefined}
            className="font-mono text-sm"
          />
        </div>

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={busy || input.trim() === ""}>
            {busy ? "Analyzing…" : "Analyze page"}
          </Button>
          <ResetButton onClick={handleReset} disabled={busy || (!input && !hasResult)} />
        </div>

        <div id={errorId}>
          <ErrorAlert error={error} />
        </div>
      </form>

      <div className="flex flex-col gap-6">
        {output && hasResult ? (
          <>
            {output.notAnalyzed ? (
              <ResultCard title="Not analyzed">
                <p className="text-sm text-muted-foreground">{output.warnings[0]}</p>
              </ResultCard>
            ) : head ? (
              <>
                <ResultCard
                  title={`Page meta · HTTP ${output.status} · ${(output.sizeBytes / 1024).toFixed(1)} KB`}
                >
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label={`Title (${head.titleLength} characters)`} value={head.title} />
                    <Field
                      label={`Description (${head.descriptionLength} characters)`}
                      value={head.description}
                    />
                    <Field label="Canonical" value={head.canonical} />
                    <Field label="Robots" value={head.robots} />
                    <Field label="Viewport" value={head.viewport} />
                    <Field label="Language" value={head.lang} />
                    <Field label="Charset" value={head.charset} />
                    <Field label="Favicon" value={head.favicon} />
                  </div>

                  <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm">
                    <span className="text-xs font-medium text-muted-foreground">Headings:</span>
                    <span>{output.analysis.h1Count} h1</span>
                    <span>{output.analysis.h2Count} h2</span>
                    <span>{output.analysis.h3Count} h3</span>
                    <span>
                      {output.analysis.jsonLdBlockCount} JSON-LD{" "}
                      {output.analysis.hasSchemaOrg ? "· schema.org" : ""}
                    </span>
                  </div>
                </ResultCard>

                <ResultCard title="Social tags">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="og:title" value={output.analysis.og.title} />
                    <Field label="og:description" value={output.analysis.og.description} />
                    <Field label="og:image" value={output.analysis.og.image} />
                    <Field label="og:url" value={output.analysis.og.url} />
                    <Field label="og:type" value={output.analysis.og.type} />
                    <Field label="og:site_name" value={output.analysis.og.siteName} />
                    <Field label="twitter:card" value={output.analysis.twitter.card} />
                    <Field label="twitter:title" value={output.analysis.twitter.title} />
                    <Field
                      label="twitter:description"
                      value={output.analysis.twitter.description}
                    />
                    <Field label="twitter:image" value={output.analysis.twitter.image} />
                  </div>
                </ResultCard>

                {output.flags.length > 0 ? (
                  <ResultCard title="Findings">
                    <ul className="flex flex-col gap-3">
                      {output.flags.map((flag) => (
                        <li key={flag.fact} className="flex items-start gap-3">
                          <KindBadge kind={flag.kind} />
                          <div className="min-w-0">
                            <p className="text-sm">{flag.fact}</p>
                            {flag.recommendation ? (
                              <p className="mt-0.5 text-xs text-muted-foreground">
                                {flag.recommendation}
                              </p>
                            ) : null}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </ResultCard>
                ) : null}

                {output.warnings.length > 0 ? (
                  <p className="text-xs text-muted-foreground">{output.warnings.join(" ")}</p>
                ) : null}
              </>
            ) : null}
          </>
        ) : null}
      </div>
    </div>
  )
}
