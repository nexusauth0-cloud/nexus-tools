"use client"

import { useId, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CopyButton } from "@/components/tool/outputs/copy-button"
import { ErrorAlert } from "@/components/tool/outputs/error-alert"
import { ResetButton } from "@/components/tool/outputs/reset-button"
import { ResultCard } from "@/components/tool/outputs/result-card"
import { useTool } from "@/lib/tool-engine"
import { rebuildUrlWithoutTracking, urlParserEngine, type UrlParameter } from "./engine"
import { manifest } from "./manifest"

function Part({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <span className="break-all font-mono text-sm" title={value ?? undefined}>
        {value ?? "—"}
      </span>
    </div>
  )
}

export default function UrlParserTool() {
  const [input, setInput] = useState("")
  const { status, result, error, run, reset } = useTool(urlParserEngine)

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
  const cleaned = output
    ? rebuildUrlWithoutTracking(output.url, [...new Set(output.trackingParams)])
    : null

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-5"
        noValidate
        aria-label="URL input form"
      >
        <div className="flex flex-col gap-2">
          <Label htmlFor={`${manifest.slug}-input`}>URL</Label>
          <Input
            id={`${manifest.slug}-input`}
            type="url"
            inputMode="url"
            spellCheck={false}
            autoComplete="off"
            placeholder="https://example.com/path?q=1…"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? errorId : undefined}
            className="font-mono text-sm"
          />
        </div>

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={busy || input.trim() === ""}>
            {busy ? "Parsing…" : "Parse URL"}
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
            <ResultCard title="URL components">
              <div className="grid gap-4 sm:grid-cols-2">
                <Part label="Protocol" value={output.protocol} />
                <Part label="Origin" value={output.origin} />
                <Part label="Hostname" value={output.hostname} />
                <Part label="Port" value={output.port} />
                <Part label="Pathname" value={output.pathname} />
                <Part label="Hash" value={output.hash || null} />
              </div>
              <p className="mt-4 break-all rounded-lg border border-border bg-background/60 p-3 font-mono text-[13px]">
                {output.url}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {output.usernamePresent || output.passwordPresent ? (
                  <Badge variant="destructive">
                    {output.usernamePresent ? "username" : ""}
                    {output.usernamePresent && output.passwordPresent ? " + " : ""}
                    {output.passwordPresent ? "password" : ""} hidden
                  </Badge>
                ) : null}
                {output.duplicateKeys.length > 0 ? (
                  <Badge variant="secondary">{output.duplicateKeys.length} duplicate key(s)</Badge>
                ) : null}
                {output.emptyValueCount > 0 ? (
                  <Badge variant="secondary">{output.emptyValueCount} empty value(s)</Badge>
                ) : null}
                {output.trackingParams.length > 0 ? (
                  <Badge variant="warning">
                    {output.trackingParams.length} tracking parameter(s)
                  </Badge>
                ) : null}
              </div>
              <p className="mt-3 text-xs text-muted-foreground">{output.trackingNotice}</p>
            </ResultCard>

            <Card className="h-fit">
              <CardHeader className="flex-row items-center justify-between space-y-0 gap-2 pb-3">
                <CardTitle className="text-base">Query parameters</CardTitle>
              </CardHeader>
              <CardContent>
                {output.params.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No query parameters on this URL.</p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {output.params.map((param: UrlParameter) => (
                      <div
                        key={`${param.key}-${param.occurrence}`}
                        className="flex items-center gap-2 rounded-lg border border-border bg-background/60 px-3 py-2"
                      >
                        <span className="min-w-0 flex-1 break-all font-mono text-[13px]">
                          {param.key}
                          {param.occurrence > 0 ? (
                            <span className="text-muted-foreground"> #{param.occurrence + 1}</span>
                          ) : null}
                        </span>
                        <span className="max-w-1/2 break-all font-mono text-[13px] text-muted-foreground">
                          {param.value === "" ? "(empty)" : `= ${param.value}`}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {cleaned && cleaned.removed.length > 0 ? (
                  <div className="mt-4 flex flex-col gap-2">
                    <p className="text-xs text-muted-foreground">
                      URL without tracking parameters ({cleaned.removed.join(", ")}):
                    </p>
                    <div className="flex items-center gap-2">
                      <p className="min-w-0 flex-1 break-all font-mono text-[13px]">
                        {cleaned.url}
                      </p>
                      <CopyButton text={cleaned.url} label="Copy" />
                    </div>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </>
        ) : null}
      </div>
    </div>
  )
}
