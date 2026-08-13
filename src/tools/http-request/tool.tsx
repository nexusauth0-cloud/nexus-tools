"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { CodeEditor } from "@/components/tool/inputs/code-editor"
import { CodeBlock } from "@/components/tool/outputs/code-block"
import { CopyButton } from "@/components/tool/outputs/copy-button"
import { ErrorAlert } from "@/components/tool/outputs/error-alert"
import { ResetButton } from "@/components/tool/outputs/reset-button"
import { useTool } from "@/lib/tool-engine"
import { httpRequestEngine, RESPONSE_DISPLAY_CAP, type HttpRequestBodyKind } from "./engine"
import { manifest } from "./manifest"
import { HTTP_DEFAULT_TIMEOUT_MS, HTTP_METHODS, type HttpMethod } from "@/lib/http"
import { Plus, Trash2, Copy as CopyIcon, Send, Square, ShieldAlert } from "lucide-react"

interface HeaderRow {
  id: string
  name: string
  value: string
}

function newHeaderRow(): HeaderRow {
  return { id: cryptoRandomId(), name: "", value: "" }
}

function cryptoRandomId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
}

const BODY_KIND_OPTIONS: Array<{ value: HttpRequestBodyKind; label: string }> = [
  { value: "none", label: "None" },
  { value: "json", label: "JSON" },
  { value: "text", label: "Text" },
  { value: "form", label: "Form (url-encoded)" },
]

export default function HttpRequest() {
  const [method, setMethod] = React.useState<HttpMethod>("GET")
  const [url, setUrl] = React.useState("https://jsonplaceholder.typicode.com/todos/1")
  const [headers, setHeaders] = React.useState<HeaderRow[]>(() => [newHeaderRow()])
  const [bodyKind, setBodyKind] = React.useState<HttpRequestBodyKind>("none")
  const [body, setBody] = React.useState('{\n  "title": "hello"\n}')
  const [timeoutMs, setTimeoutMs] = React.useState(HTTP_DEFAULT_TIMEOUT_MS)

  const abortRef = React.useRef<AbortController | null>(null)
  const { status, result, error, run, reset } = useTool(httpRequestEngine)
  const busy = status === "validating" || status === "processing"
  const errorId = `${manifest.slug}-error`

  const updateHeader = (id: string, patch: Partial<HeaderRow>) =>
    setHeaders((previous) => previous.map((row) => (row.id === id ? { ...row, ...patch } : row)))

  const removeHeader = (id: string) =>
    setHeaders((previous) =>
      previous.length > 1 ? previous.filter((row) => row.id !== id) : previous
    )

  const duplicateHeader = (id: string) => {
    const source = headers.find((row) => row.id === id)
    if (!source) return
    const copy = { ...source, id: cryptoRandomId() }
    const index = headers.findIndex((row) => row.id === id)
    setHeaders((previous) => [...previous.slice(0, index + 1), copy, ...previous.slice(index + 1)])
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    // Guard: an aborted run re-renders Cancel → Send mid-click, and the
    // browser may then submit the form again. Ignore submits while busy so
    // cancel/timeout paths can't spawn a second request.
    if (busy) return
    const controller = new AbortController()
    abortRef.current = controller
    void run({
      method,
      url,
      headers: headers.filter((row) => row.name.trim() !== ""),
      bodyKind,
      body,
      timeoutMs,
      signal: controller.signal,
    })
  }

  const handleCancel = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
    abortRef.current?.abort(new DOMException("Request cancelled", "AbortError"))
  }

  const handleReset = () => {
    abortRef.current = null
    reset()
    setMethod("GET")
    setHeaders(() => [newHeaderRow()])
    setBodyKind("none")
    setBody('{\n  "title": "hello"\n}')
    setTimeoutMs(HTTP_DEFAULT_TIMEOUT_MS)
  }

  const output = result?.output
  const requestSupportsBody = method !== "GET" && method !== "HEAD"
  const prettyBody =
    output && isJsonLike(output.responseBody) ? tryPrettyJson(output.responseBody) : null

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-5"
        noValidate
        aria-label="HTTP request form"
      >
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="flex flex-col gap-2 sm:w-36">
            <Label htmlFor={`${manifest.slug}-method`}>Method</Label>
            <Select
              value={method}
              onValueChange={(value) => {
                setMethod(value as HttpMethod)
                if (value === "GET" || value === "HEAD") setBodyKind("none")
              }}
            >
              <SelectTrigger id={`${manifest.slug}-method`} aria-label="HTTP method">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {HTTP_METHODS.map((value) => (
                  <SelectItem key={value} value={value}>
                    {value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-1 flex-col gap-2">
            <Label htmlFor={`${manifest.slug}-url`}>URL</Label>
            <Input
              id={`${manifest.slug}-url`}
              type="text"
              inputMode="url"
              placeholder="https://api.example.com/v1/items"
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              aria-describedby={`${manifest.slug}-url-hint`}
            />
          </div>
        </div>
        <p id={`${manifest.slug}-url-hint`} className="text-xs text-muted-foreground">
          Requests are sent directly from your browser. The destination server must allow browser
          CORS requests.
        </p>

        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <Label>Headers</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setHeaders((previous) => [...previous, newHeaderRow()])}
            >
              <Plus />
              Add header
            </Button>
          </div>
          <ul className="flex flex-col gap-2" aria-label="Request headers">
            {headers.map((row) => (
              <li key={row.id} className="flex gap-2">
                <Input
                  type="text"
                  spellCheck={false}
                  placeholder="Header name"
                  aria-label="Header name"
                  value={row.name}
                  onChange={(event) => updateHeader(row.id, { name: event.target.value })}
                  className="w-40 shrink-0"
                />
                <Input
                  type="text"
                  spellCheck={false}
                  placeholder="Value"
                  aria-label="Header value"
                  value={row.value}
                  onChange={(event) => updateHeader(row.id, { value: event.target.value })}
                  autoComplete="off"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Duplicate header"
                  onClick={() => duplicateHeader(row.id)}
                >
                  <CopyIcon />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Remove header"
                  onClick={() => removeHeader(row.id)}
                  disabled={headers.length === 1}
                >
                  <Trash2 />
                </Button>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor={`${manifest.slug}-body-kind`}>Body</Label>
          <Select
            value={bodyKind}
            onValueChange={(value) => setBodyKind(value as HttpRequestBodyKind)}
          >
            <SelectTrigger id={`${manifest.slug}-body-kind`} aria-label="Request body type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {BODY_KIND_OPTIONS.map((option) => (
                <SelectItem
                  key={option.value}
                  value={option.value}
                  disabled={!requestSupportsBody && option.value !== "none"}
                >
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {bodyKind !== "none" ? (
          <CodeEditor
            id={`${manifest.slug}-body`}
            label={
              bodyKind === "json" ? "JSON body" : bodyKind === "form" ? "Form body" : "Text body"
            }
            value={body}
            onChange={(event) => setBody(event.target.value)}
            showCount
            className="min-h-40"
          />
        ) : null}

        <div className="flex flex-col gap-2 sm:w-48">
          <Label htmlFor={`${manifest.slug}-timeout`}>Timeout (seconds)</Label>
          <Input
            id={`${manifest.slug}-timeout`}
            type="number"
            inputMode="numeric"
            min={1}
            max={120}
            value={Math.round(timeoutMs / 1000)}
            onChange={(event) => setTimeoutMs(Number(event.target.value) * 1000)}
          />
        </div>

        <div className="flex items-center gap-3">
          {busy ? (
            <Button type="button" variant="destructive" onClick={handleCancel}>
              <Square />
              Cancel
            </Button>
          ) : (
            <Button type="submit" disabled={url.trim() === ""}>
              <Send />
              Send
            </Button>
          )}
          <ResetButton onClick={handleReset} disabled={busy || (result === null && !error)} />
        </div>

        <div id={errorId}>
          <ErrorAlert error={error} />
        </div>
      </form>

      <div className="flex flex-col gap-5">
        {output ? (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">Response</CardTitle>
                <div className="flex items-center gap-2">
                  <span
                    role="status"
                    className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      output.status !== null && output.status < 400
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        : "bg-destructive/10 text-destructive"
                    }`}
                  >
                    {output.status ?? "—"} {output.statusText}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {Math.round(output.durationMs)}ms
                  </span>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <p className="break-all text-xs text-muted-foreground">
                  {output.method} {output.url} · {formatBytes(output.responseSizeBytes)}
                  {output.truncated
                    ? ` · body truncated at ${formatBytes(RESPONSE_DISPLAY_CAP)}`
                    : ""}
                </p>
                <Tabs defaultValue="body">
                  <TabsList aria-label="Response views">
                    <TabsTrigger value="body">Body</TabsTrigger>
                    <TabsTrigger value="headers">Headers</TabsTrigger>
                  </TabsList>
                  <TabsContent value="body" className="flex flex-col gap-3">
                    {prettyBody ? (
                      <CodeBlock maxHeight={400}>{prettyBody}</CodeBlock>
                    ) : (
                      <CodeBlock maxHeight={400}>{output.responseBody || "(empty body)"}</CodeBlock>
                    )}
                    <div className="flex gap-2">
                      <CopyButton text={prettyBody ?? output.responseBody} label="Copy body" />
                    </div>
                  </TabsContent>
                  <TabsContent value="headers">
                    {output.responseHeaders.length > 0 ? (
                      <ul className="flex flex-col gap-1.5 rounded-lg border border-border bg-background/40 p-3 text-xs">
                        {output.responseHeaders.map((header) => (
                          <li key={header.name}>
                            <span className="font-medium text-foreground">{header.name}: </span>
                            <span className="break-all text-muted-foreground">{header.value}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        No response headers are readable. Browsers only expose headers the
                        destination allows via Access-Control-Expose-Headers.
                      </p>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            <p
              role="note"
              className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2.5 text-sm text-amber-700 dark:text-amber-400"
            >
              <ShieldAlert className="mt-0.5 size-4 shrink-0" />
              Header values are never stored in history, and query strings are stripped from history
              summaries — sensitive request data stays in this page only.
            </p>
          </>
        ) : (
          <div className="flex min-h-64 items-center justify-center rounded-xl border border-dashed border-border bg-background/40 p-6 text-sm text-muted-foreground">
            The response — status, headers, body, and timing — appears here.
          </div>
        )}
      </div>
    </div>
  )
}

function isJsonLike(text: string): boolean {
  const trimmed = text.trim()
  return trimmed.startsWith("{") || trimmed.startsWith("[")
}

function tryPrettyJson(text: string): string | null {
  try {
    return JSON.stringify(JSON.parse(text), null, 2)
  } catch {
    return null
  }
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}
