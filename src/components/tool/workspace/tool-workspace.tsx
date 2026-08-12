"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { ArrowUpRight, FolderOpen, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CodeEditor } from "@/components/tool/inputs/code-editor"
import { Segmented, type SegmentedOption } from "@/components/tool/inputs/segmented"
import { OutputPanel } from "@/components/tool/outputs/output-panel"
import { CommonResults } from "./common-results"
import { runWiredTool, type RunToolOutcome } from "@/lib/engine/engine"
import { getRuntimeLoader } from "@/lib/tools"
import { MAX_INPUT_CHARS } from "@/lib/engine/caps"

export interface WorkspaceDecl {
  id: string
  title: string
  subtitle?: string
  category: string
  icon: string
  accent?: string
  description: string[]
  hint?: string
  faq?: Array<{ q: string; a: string[] }>
  defaultInput?: string
  params?: Array<{
    key: string
    label: string
    defaultValue?: string
    options?: Array<{ value: string; label?: string }>
    helpText?: string
  }>
  presets?: Array<{ label: string; input?: string; params?: Record<string, string> }>
  examples?: Array<{ label: string; input: string; params?: Record<string, string> }>
  emptyInputPlaceholder?: string
}

interface ToolWorkspaceProps {
  /** Wired static tool entry (server page). */
  decl: WorkspaceDecl
  entryPoint: string
  /** Other static tools, for the switcher ("other conversions"). */
  switcherTools: Array<{ id: string; title: string }>
}

interface DisplayedError {
  message: string
  line?: number
  column?: number
}

function defaultParams(decl: WorkspaceDecl): Record<string, string> {
  const params: Record<string, string> = {}
  for (const param of decl.params ?? []) {
    if (param.defaultValue !== undefined) params[param.key] = param.defaultValue
  }
  return params
}

function exampleAsParams(decl: WorkspaceDecl, example?: { input?: string; params?: Record<string, string> }): { input: string; params: Record<string, string> } {
  const base = defaultParams(decl)
  return {
    input: example?.input ?? decl.defaultInput ?? "",
    params: { ...base, ...(example?.params ?? {}) },
  }
}

/**
 * Client workspace for static tools: input editor + param controls +
 * run/reset, running the tool in the browser through the per-tool dynamic
 * loader. Uploads are read locally; nothing leaves the device.
 */
export function ToolWorkspace({ decl, entryPoint, switcherTools }: ToolWorkspaceProps) {
  const router = useRouter()
  const loader = React.useMemo(() => getRuntimeLoader(entryPoint), [entryPoint])
  const starter = React.useMemo(
    () => exampleAsParams(decl, decl.examples?.[0]),
    [decl],
  )

  const [input, setInput] = React.useState(starter.input)
  const [params, setParams] = React.useState<Record<string, string>>(starter.params)
  const [busy, setBusy] = React.useState(false)
  const [outcome, setOutcome] = React.useState<RunToolOutcome | null>(null)
  const [error, setError] = React.useState<DisplayedError | null>(null)
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const errorId = React.useId()

  const canRun = input.trim().length > 0 && !busy

  const run = React.useCallback(
    async (source: { input: string; params: Record<string, string> }) => {
      if (!loader || source.input.trim() === "") return
      setBusy(true)
      setError(null)
      try {
        const result = await runWiredTool(loader, { input: source.input, params: source.params })
        if (result.ok || !result.error) {
          setOutcome(result)
          setError(null)
        } else {
          setError(result.error)
          setOutcome(null)
        }
      } catch {
        setError({ message: "The tool could not process this input." })
        setOutcome(null)
      } finally {
        setBusy(false)
      }
    },
    [loader],
  )

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    void run({ input, params })
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
      event.preventDefault()
      void run({ input, params })
    }
  }

  const handleUpload = async (file: File) => {
    const text = await file.text()
    if (text.length === 0) {
      setError({ message: "The uploaded file is empty." })
      return
    }
    if (text.length > MAX_INPUT_CHARS) {
      setError({ message: `The file is too large (over ${MAX_INPUT_CHARS.toLocaleString()} characters).` })
      return
    }
    setError(null)
    setInput(text)
  }

  const handleReset = () => {
    setInput(starter.input)
    setParams(starter.params)
    setOutcome(null)
    setError(null)
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate aria-label={`${decl.title} form`}>
        {switcherTools.length > 1 ? (
          <label className="flex flex-col gap-2 text-sm">
            <span className="font-medium text-foreground">Other converters</span>
            <select
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
              value={decl.id}
              onChange={(event) => router.push(`/t/${event.target.value}`)}
            >
              {switcherTools.map((tool) => (
                <option key={tool.id} value={tool.id}>
                  {tool.title}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        <CodeEditor
          id={`${decl.id}-input`}
          label="Input"
          placeholder={decl.emptyInputPlaceholder ?? "Paste input here…"}
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={handleKeyDown}
          showCount
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
        />

        {decl.params?.map((param) =>
          param.options && param.options.length > 0 ? (
            <Segmented
              key={param.key}
              label={param.label}
              options={param.options as SegmentedOption<string>[]}
              value={params[param.key] ?? param.defaultValue ?? param.options[0]!.value}
              onChange={(value) => setParams((current) => ({ ...current, [param.key]: value }))}
            />
          ) : (
            <label key={param.key} className="flex flex-col gap-2 text-sm">
              <span className="font-medium text-foreground">{param.label}</span>
              <input
                className="h-9 rounded-md border border-input bg-background px-3 font-mono text-sm"
                value={params[param.key] ?? ""}
                placeholder={param.helpText}
                onChange={(event) =>
                  setParams((current) => ({ ...current, [param.key]: event.target.value }))
                }
              />
            </label>
          ),
        )}

        {decl.presets && decl.presets.length > 0 ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground">Quick start:</span>
            {decl.presets.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => {
                  const next = exampleAsParams(decl, preset)
                  setInput(next.input)
                  setParams(next.params)
                }}
                className="rounded-full border border-border px-3 py-1 text-xs text-foreground transition-colors hover:border-gold/50 hover:bg-gold/10"
              >
                {preset.label}
              </button>
            ))}
          </div>
        ) : null}

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={!canRun}>
            {busy ? "Converting…" : "Convert"}
          </Button>
          <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
            <FolderOpen className="mr-2 size-4" />
            Open file
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,.yaml,.yml,.csv,.txt,text/*"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0]
              if (file) void handleUpload(file)
              event.target.value = ""
            }}
          />
          <Button
            type="button"
            variant="ghost"
            onClick={handleReset}
            disabled={busy || (!input && !outcome && !error)}
          >
            <RotateCcw className="mr-2 size-4" />
            Reset
          </Button>
        </div>

        <div id={errorId} role="alert" aria-live="polite">
          {error ? (
            <div className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
              <span className="font-medium">{error.message}</span>
              {error.line !== undefined ? (
                <span className="ml-auto shrink-0 font-mono text-xs text-destructive/80">
                  line {error.line}
                  {error.column !== undefined ? `, column ${error.column}` : ""}
                </span>
              ) : null}
            </div>
          ) : null}
        </div>

        {decl.hint ? <p className="text-xs text-muted-foreground">{decl.hint}</p> : null}
      </form>
      {outcome ? (
        <div className="flex flex-col gap-4">
          {outcome.blocks && outcome.blocks.length > 0 ? (
            <CommonResults blocks={outcome.blocks} info={outcome.info} />
          ) : (
            <OutputPanel
              text={outcome.output}
              value={undefined}
              filename={decl.id}
              title="Result"
              meta={
                outcome.info && Object.keys(outcome.info).length > 0 ? (
                  <dl className="mt-1 grid grid-cols-[auto_1fr] gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
                    {Object.entries(outcome.info!).map(([key, value]) => (
                      <React.Fragment key={key}>
                        <dt>{key}</dt>
                        <dd className="font-mono text-foreground">{value}</dd>
                      </React.Fragment>
                    ))}
                  </dl>
                ) : undefined
              }
            />
          )}
        </div>
      ) : null}

      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <ArrowUpRight className="size-3.5" />
        Runs entirely in your browser — nothing is uploaded.
      </p>
    </div>
  )
}
