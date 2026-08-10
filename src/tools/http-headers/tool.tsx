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
import { httpHeadersEngine, type HeaderFinding } from "./engine"
import { manifest } from "./manifest"

function StateBadge({ state }: { state: HeaderFinding["state"] }) {
  if (state === "exposed") {
    return <Badge variant="success">exposed</Badge>
  }
  return <Badge variant="secondary">missing</Badge>
}

export default function HttpHeadersTool() {
  const [input, setInput] = useState("")
  const { status, result, error, run, reset } = useTool(httpHeadersEngine)

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

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-5"
        noValidate
        aria-label="Header check form"
      >
        <div className="flex flex-col gap-2">
          <Label htmlFor={`${manifest.slug}-input`}>Website URL</Label>
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
            {busy ? "Checking headers…" : "Check headers"}
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
            <ResultCard
              title={`Headers · HTTP ${output.status}${output.statusText ? ` ${output.statusText}` : ""}`}
            >
              <div className="flex flex-col gap-2">
                {output.findings.map((finding) => (
                  <div
                    key={finding.name}
                    className="flex items-start justify-between gap-3 rounded-lg border border-border bg-background/60 px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="font-mono text-[13px]">{finding.name}</p>
                      <p className="mt-1 break-all font-mono text-xs text-muted-foreground">
                        {finding.value ?? "Not sent (or hidden from the browser)"}
                      </p>
                    </div>
                    <StateBadge state={finding.state} />
                  </div>
                ))}
              </div>
              <p className="mt-4 text-xs text-muted-foreground">{output.note}</p>
            </ResultCard>

            {output.recommendations.length > 0 ? (
              <ResultCard title="Recommendations">
                <ul className="flex flex-col gap-2">
                  {output.recommendations.map((recommendation) => (
                    <li key={recommendation} className="text-sm text-muted-foreground">
                      {recommendation}
                    </li>
                  ))}
                </ul>
              </ResultCard>
            ) : null}
          </>
        ) : null}
      </div>
    </div>
  )
}
