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
import type { SitemapViolationKind } from "@/lib/url/sitemap"
import { sitemapCheckerEngine } from "./engine"
import { manifest } from "./manifest"

const VIOLATION_LABELS: Record<SitemapViolationKind, string> = {
  "missing-loc": "Missing <loc>",
  "duplicate-loc": "Duplicate URL",
  "invalid-loc": "Invalid URL",
  "invalid-priority": "Priority out of range",
  "invalid-changefreq": "Unknown changefreq",
}

export default function SitemapCheckerTool() {
  const [input, setInput] = useState("")
  const { status, result, error, run, reset } = useTool(sitemapCheckerEngine)

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
  const parsed = output?.parsed

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-5"
        noValidate
        aria-label="Sitemap check form"
      >
        <div className="flex flex-col gap-2">
          <Label htmlFor={`${manifest.slug}-input`}>Sitemap URL</Label>
          <Input
            id={`${manifest.slug}-input`}
            type="url"
            inputMode="url"
            spellCheck={false}
            autoComplete="off"
            placeholder="https://example.com/sitemap.xml…"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? errorId : undefined}
            className="font-mono text-sm"
          />
        </div>

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={busy || input.trim() === ""}>
            {busy ? "Checking sitemap…" : "Check sitemap"}
          </Button>
          <ResetButton onClick={handleReset} disabled={busy || (!input && !hasResult)} />
        </div>

        <div id={errorId}>
          <ErrorAlert error={error} />
        </div>
      </form>

      <div className="flex flex-col gap-6">
        {output && hasResult && parsed ? (
          <>
            {output.warnings.length > 0 ? (
              <ResultCard title="Warnings">
                <ul className="flex flex-col gap-1">
                  {output.warnings.map((warning) => (
                    <li key={warning} className="text-sm text-destructive">
                      {warning}
                    </li>
                  ))}
                </ul>
              </ResultCard>
            ) : null}

            {parsed.ok ? (
              <>
                <ResultCard title={`Summary · HTTP ${output.status}`}>
                  <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">Type</p>
                      <p className="capitalize">{parsed.root}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">Items</p>
                      <p>{parsed.entries.length}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">
                        {parsed.root === "sitemapindex" ? "Directory of" : "Lastmod present on"}
                      </p>
                      <p>{parsed.lastmodCount}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">Violations</p>
                      <p
                        className={
                          parsed.violations.length > 0 ? "text-destructive" : "text-success"
                        }
                      >
                        {parsed.violations.length}
                      </p>
                    </div>
                  </div>
                </ResultCard>

                {parsed.violations.length > 0 ? (
                  <ResultCard title={`Violations (${parsed.violations.length})`}>
                    <ul className="flex flex-col gap-2">
                      {parsed.violations.map((violation, index) => (
                        <li key={`${violation.kind}-${violation.url ?? ""}-${index}`}>
                          <Badge variant="destructive">{VIOLATION_LABELS[violation.kind]}</Badge>
                          <p className="mt-1 break-all text-sm text-muted-foreground">
                            {violation.detail}
                            {violation.url ? (
                              <span className="block break-all font-mono text-xs">
                                {violation.url}
                              </span>
                            ) : null}
                          </p>
                        </li>
                      ))}
                    </ul>
                  </ResultCard>
                ) : null}

                {output.sampleUrls.length > 0 ? (
                  <ResultCard title={`Sample URLs (${output.sampleUrls.length})`}>
                    <ul className="flex flex-col gap-2">
                      {output.sampleUrls.map((url) => (
                        <li key={url} className="break-all font-mono text-[13px]">
                          {url}
                        </li>
                      ))}
                    </ul>
                    {parsed.entries.length > output.sampleUrls.length ? (
                      <p className="mt-3 text-xs text-muted-foreground">
                        {parsed.entries.length - output.sampleUrls.length} more not shown.
                      </p>
                    ) : null}
                  </ResultCard>
                ) : null}
              </>
            ) : (
              <ResultCard title="Could not parse">
                <p className="text-sm text-muted-foreground">
                  The response was not valid XML, so nothing inside it could be analyzed.
                </p>
              </ResultCard>
            )}
          </>
        ) : null}
      </div>
    </div>
  )
}
