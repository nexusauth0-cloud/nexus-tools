"use client"

import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CodeEditor } from "@/components/tool/inputs/code-editor"
import { CodeBlock } from "@/components/tool/outputs/code-block"
import { CopyButton } from "@/components/tool/outputs/copy-button"
import { ErrorAlert } from "@/components/tool/outputs/error-alert"
import { ResultCard } from "@/components/tool/outputs/result-card"
import { ResetButton } from "@/components/tool/outputs/reset-button"
import { useTool } from "@/lib/tool-engine"
import { jwtDecoderEngine } from "./engine"
import { manifest } from "./manifest"

const DATE_ROWS = [
  { key: "iat", label: "Issued at" },
  { key: "nbf", label: "Valid from" },
  { key: "exp", label: "Expires" },
] as const

function timeRemainingLabel(seconds: number): string {
  if (seconds < 60) return "under a minute"
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"}`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"}`
  const days = Math.floor(hours / 24)
  return `${days} day${days === 1 ? "" : "s"}`
}

export default function JwtDecoder() {
  const [token, setToken] = useState("")

  const { status, result, error, run, reset } = useTool(jwtDecoderEngine)

  const busy = status === "validating" || status === "processing"
  const hasResult = result !== null
  const errorId = `${manifest.slug}-error`

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    void run({ token })
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
      event.preventDefault()
      void run({ token })
    }
  }

  const handleReset = () => {
    reset()
    setToken("")
  }

  const decoded = result?.output

  const exportValue = useMemo(() => {
    if (!decoded) return undefined
    return { header: decoded.header, payload: decoded.payload }
  }, [decoded])

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-5"
        noValidate
        aria-label="JWT input form"
      >
        <CodeEditor
          id={`${manifest.slug}-input`}
          label="JWT (header.payload.signature)"
          placeholder="Paste an access token, e.g. eyJhbGciOi…"
          value={token}
          onChange={(event) => setToken(event.target.value)}
          onKeyDown={handleKeyDown}
          showCount
          className="min-h-40"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
        />

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={busy || token.trim() === ""}>
            {busy ? "Decoding…" : "Decode token"}
          </Button>
          <ResetButton onClick={handleReset} disabled={busy || (!token && !hasResult)} />
        </div>

        <div id={errorId}>
          <ErrorAlert error={error} />
        </div>

        {hasResult && decoded ? (
          <p
            role="note"
            className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2.5 text-sm text-amber-700 dark:text-amber-400"
          >
            {decoded.notice}
          </p>
        ) : null}
      </form>

      {hasResult && decoded ? (
        <div className="flex flex-col gap-6">
          <ResultCard
            title="Decoded token"
            actions={
              <CopyButton text={JSON.stringify(exportValue, null, 2)} label="Copy decoded" />
            }
          >
            <div className="flex flex-col gap-4">
              <div>
                <h3 className="mb-1 text-sm font-medium text-foreground">Header</h3>
                <CodeBlock maxHeight={120} aria-label="Decoded header">
                  {JSON.stringify(decoded.header, null, 2)}
                </CodeBlock>
              </div>
              <div>
                <h3 className="mb-1 text-sm font-medium text-foreground">Payload</h3>
                <CodeBlock maxHeight={240} aria-label="Decoded payload">
                  {JSON.stringify(decoded.payload, null, 2)}
                </CodeBlock>
              </div>
            </div>
          </ResultCard>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Registered claims</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                {(["iss", "sub", "aud", "jti"] as const).map((claim) => {
                  const value = decoded.claims[claim]
                  if (value === undefined) return null
                  return (
                    <div key={claim} className="flex flex-col gap-0.5">
                      <dt className="font-mono text-xs text-muted-foreground">{claim}</dt>
                      <dd className="max-w-full break-words font-medium">{String(value)}</dd>
                    </div>
                  )
                })}
                {decoded.claims.iss === undefined &&
                decoded.claims.sub === undefined &&
                decoded.claims.aud === undefined &&
                decoded.claims.jti === undefined ? (
                  <p className="col-span-full text-xs text-muted-foreground">
                    No iss, sub, aud or jti claims present.
                  </p>
                ) : null}
              </dl>

              {DATE_ROWS.map(({ key, label }) => {
                const info = decoded.dates[key]
                if (!info) return null
                return (
                  <div key={key} className="rounded-lg border border-border px-3 py-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-mono font-medium text-muted-foreground">
                        {label} ({key})
                      </span>
                      {key === "exp" ? (
                        info.expired ? (
                          <span
                            className="rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive"
                            role="status"
                          >
                            Expired
                          </span>
                        ) : (
                          <span
                            className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400"
                            role="status"
                          >
                            {timeRemainingLabel(info.relativeSeconds)} remaining
                          </span>
                        )
                      ) : null}
                    </div>
                    <p className="mt-1 text-sm font-medium">{info.utc}</p>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  )
}
