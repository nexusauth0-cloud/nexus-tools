"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CodeEditor } from "@/components/tool/inputs/code-editor"
import { CodeBlock } from "@/components/tool/outputs/code-block"
import { CopyButton } from "@/components/tool/outputs/copy-button"
import { ErrorAlert } from "@/components/tool/outputs/error-alert"
import { ResetButton } from "@/components/tool/outputs/reset-button"
import { useTool } from "@/lib/tool-engine"
import { jsonPathTesterEngine, type JsonPathMatchView } from "./engine"
import { manifest } from "./manifest"

const DEFAULT_JSON = `{
  "store": {
    "book": [
      {
        "category": "fiction",
        "author": "Nigel Rees",
        "title": "Sayings of the Century",
        "price": 8.95
      },
      {
        "category": "fiction",
        "author": "Evelyn Waugh",
        "title": "Sword of Honour",
        "price": 12.99
      },
      {
        "category": "nonfiction",
        "author": "Herman Melville",
        "title": "Moby Dick",
        "isbn": "0-553-21311-3",
        "price": 8.99
      }
    ],
    "bicycle": {
      "color": "red",
      "price": 19.95
    }
  }
}`

const EXAMPLES = [
  { label: "$.store.book[*].author", expression: "$.store.book[*].author" },
  { label: "$.store.book[0].title", expression: "$.store.book[0].title" },
  { label: "$..price", expression: "$..price" },
  {
    label: "$.store.book[?(@.price < 10)].title",
    expression: "$.store.book[?(@.price < 10)].title",
  },
  { label: "$.store.book[0:2].category", expression: "$.store.book[0:2].category" },
  { label: "$.store.book[0,2].author", expression: "$.store.book[0,2].author" },
]

export default function JsonPathTester() {
  const [json, setJson] = React.useState(DEFAULT_JSON)
  const [expression, setExpression] = React.useState("$.store.book[*].author")

  const { status, result, error, run, reset } = useTool(jsonPathTesterEngine)
  const busy = status === "validating" || status === "processing"
  const errorId = `${manifest.slug}-error`

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    void run({ json, expression })
  }

  const handleReset = () => {
    reset()
    setJson(DEFAULT_JSON)
    setExpression("$.store.book[*].author")
  }

  const output = result?.output
  const showAll = output && output.count <= 50
  const visibleMatches = output ? (showAll ? output.matches : output.matches.slice(0, 50)) : []

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-5"
        noValidate
        aria-label="JSONPath query form"
      >
        <CodeEditor
          id={`${manifest.slug}-json`}
          label="JSON document"
          placeholder='{ "key": "value" }'
          value={json}
          onChange={(event) => setJson(event.target.value)}
          showCount
          className="min-h-72"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
        />
        <div className="flex flex-col gap-2">
          <Label htmlFor={`${manifest.slug}-expression`}>JSONPath expression</Label>
          <Input
            id={`${manifest.slug}-expression`}
            type="text"
            spellCheck={false}
            placeholder="$.store.book[*].author"
            value={expression}
            onChange={(event) => setExpression(event.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Example expressions">
          {EXAMPLES.map((example) => (
            <button
              key={example.expression}
              type="button"
              onClick={() => setExpression(example.expression)}
              className="rounded-full border border-border bg-background/60 px-3 py-1 font-mono text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
            >
              {example.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <Button type="submit" disabled={busy || json.trim() === "" || expression.trim() === ""}>
            {busy ? "Running…" : "Run query"}
          </Button>
          <ResetButton onClick={handleReset} disabled={busy || (result === null && !error)} />
        </div>
        <div id={errorId}>
          <ErrorAlert error={error} />
        </div>
      </form>

      <div className="flex flex-col gap-5">
        {output ? (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-baseline gap-2">
                <span className="text-sm font-medium">Result</span>
                <span
                  className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"
                  role="status"
                >
                  {output.count} {output.count === 1 ? "match" : "matches"}
                </span>
              </div>
              <CopyButton
                text={JSON.stringify(
                  output.matches.map((match) => ({ path: match.path, value: match.value })),
                  null,
                  2
                )}
                label="Copy results"
              />
            </div>
            <p className="text-xs text-muted-foreground">{output.documentShape}</p>

            {!showAll && output.count > 50 ? (
              <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2.5 text-sm text-amber-700 dark:text-amber-400">
                Showing the first 50 of {output.count} matches to keep the page responsive.
              </p>
            ) : null}

            <ul className="flex flex-col gap-3" aria-label="Query matches">
              {visibleMatches.map((match) => (
                <MatchRow key={match.path + match.json} match={match} />
              ))}
            </ul>
          </>
        ) : (
          <div className="flex min-h-64 items-center justify-center rounded-xl border border-dashed border-border bg-background/40 p-6 text-sm text-muted-foreground">
            Query matches appear here with their paths and values.
          </div>
        )}
      </div>
    </div>
  )
}

function MatchRow({ match }: { match: JsonPathMatchView }) {
  const [expanded, setExpanded] = React.useState(false)
  const structured = match.value !== null && typeof match.value === "object"

  if (!structured) {
    return (
      <li className="rounded-lg border border-border bg-background/60 px-3 py-2">
        <div className="flex items-start justify-between gap-3">
          <code className="break-all text-xs font-medium text-primary">{match.path}</code>
          <code className="max-w-[55%] break-all text-right text-sm">{match.json}</code>
        </div>
      </li>
    )
  }

  return (
    <li className="overflow-hidden rounded-lg border border-border bg-background/60">
      <button
        type="button"
        onClick={() => setExpanded((previous) => !previous)}
        aria-expanded={expanded}
        className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
      >
        <code className="break-all text-xs font-medium text-primary">{match.path}</code>
        <span className="text-xs text-muted-foreground">{expanded ? "Hide" : "Show value"}</span>
      </button>
      {expanded ? (
        <CodeBlock maxHeight={240} className="rounded-none border-0 border-t border-border">
          {match.json}
        </CodeBlock>
      ) : null}
    </li>
  )
}
