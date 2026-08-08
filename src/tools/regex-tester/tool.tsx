"use client"

import { useDeferredValue, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CodeEditor } from "@/components/tool/inputs/code-editor"
import { ErrorAlert } from "@/components/tool/outputs/error-alert"
import { ResetButton } from "@/components/tool/outputs/reset-button"
import { useTool } from "@/lib/tool-engine"
import {
  compilePattern,
  findMatches,
  regexTesterEngine,
  supportedFlags,
  type RegexFlag,
  type RegexOutput,
} from "./engine"
import { manifest } from "./manifest"

const FLAG_LABELS: Record<RegexFlag, string> = {
  g: "global",
  i: "case-insensitive",
  m: "multiline",
  s: "dotall",
  u: "unicode",
  y: "sticky",
}

/** Build non-overlapping highlight segments from match indexes. */
function highlightSegments(
  input: string,
  matches: RegexOutput["matches"]
): Array<{ text: string; match: boolean }> {
  const segments: Array<{ text: string; match: boolean }> = []
  let cursor = 0
  for (const match of matches) {
    if (match.index > cursor) {
      segments.push({ text: input.slice(cursor, match.index), match: false })
    }
    if (match.text.length > 0) {
      segments.push({ text: match.text, match: true })
      cursor = match.index + match.text.length
    } else {
      cursor = match.index
    }
  }
  if (cursor < input.length) {
    segments.push({ text: input.slice(cursor), match: false })
  }
  return segments.length > 0 ? segments : [{ text: input, match: false }]
}

export default function RegexTester() {
  const availableFlags = useMemo(() => supportedFlags(), [])
  const [pattern, setPattern] = useState("")
  const [flags, setFlags] = useState<string[]>(() => availableFlags.filter((f) => f === "g"))
  const [input, setInput] = useState("")
  const deferredInput = useDeferredValue(input)
  const deferredPattern = useDeferredValue(pattern)

  const { status, result, error, run, reset } = useTool(regexTesterEngine)

  const busy = status === "validating" || status === "processing"
  const errorId = `${manifest.slug}-error`
  const flagsString = flags.join("")

  const live = useMemo(() => {
    if (deferredPattern.trim() === "" || deferredInput === "") return null
    const compiled = compilePattern(deferredPattern, flagsString)
    if (typeof compiled === "string") return { error: compiled, matches: null }
    return { error: null, matches: findMatches(compiled, deferredInput) }
  }, [deferredPattern, deferredInput, flagsString])

  const flagToggle = (flag: RegexFlag, checked: boolean) => {
    setFlags((current) =>
      checked
        ? current.includes(flag)
          ? current
          : [...current, flag]
        : current.filter((f) => f !== flag)
    )
  }

  const handleRun = () => {
    void run({ pattern, flags: flagsString, input })
  }

  const handleReset = () => {
    reset()
    setPattern("")
    setFlags(["g"])
    setInput("")
  }

  const outputMatches = (live ? live.matches : result?.output.matches) ?? null
  const outputCount = outputMatches && (live || result) ? outputMatches.length : 0

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <form
        onSubmit={(event) => {
          event.preventDefault()
          handleRun()
        }}
        className="flex flex-col gap-5"
        noValidate
        aria-label="Regex test form"
      >
        <CodeEditor
          id={`${manifest.slug}-pattern`}
          label="Regular expression"
          placeholder="e.g. \\b\\w+@\\w+\\.\\w+\\b"
          value={pattern}
          onChange={(event) => setPattern(event.target.value)}
          className="min-h-24"
          aria-invalid={live?.error ? true : undefined}
        />

        <fieldset className="flex flex-wrap items-center gap-2">
          <legend className="sr-only">Regex flags</legend>
          {availableFlags.map((flag) => (
            <label
              key={flag}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-border px-2.5 py-1 text-sm transition-colors hover:bg-surface"
            >
              <input
                type="checkbox"
                checked={flags.includes(flag)}
                onChange={(event) => flagToggle(flag, event.target.checked)}
                className="size-4 accent-primary"
              />
              <span className="font-mono">{flag}</span>
              <span className="hidden text-xs text-muted-foreground sm:inline">
                {FLAG_LABELS[flag]}
              </span>
            </label>
          ))}
        </fieldset>

        <CodeEditor
          id={`${manifest.slug}-input`}
          label="Test string"
          placeholder="Paste the text to search…"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          showCount
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
        />

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={busy || pattern.trim() === ""}>
            {busy ? "Testing…" : "Test pattern"}
          </Button>
          <ResetButton
            onClick={handleReset}
            disabled={busy || (!pattern && !input && flags.length === 1)}
          />
        </div>

        <div id={errorId}>
          <ErrorAlert error={error} />
        </div>

        {live?.error ? (
          <p
            className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2.5 text-sm text-destructive"
            role="alert"
          >
            Invalid regular expression — fix it to see live matches.
          </p>
        ) : null}
      </form>

      {outputMatches ? (
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Matches
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  {live ? "live" : ""} · {outputCount.toLocaleString()} match
                  {outputCount === 1 ? "" : "es"}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="rounded-lg border border-border bg-background/60 p-3 text-[13px] leading-relaxed">
                <span className="sr-only">Highlighted test string</span>
                {highlightSegments(deferredInput, outputMatches).map((segment, index) =>
                  segment.match && segment.text.length > 0 ? (
                    <mark key={index} className="rounded-sm bg-primary/20 px-0.5 text-foreground">
                      {segment.text}
                    </mark>
                  ) : (
                    <span key={index}>{segment.text}</span>
                  )
                )}
              </div>

              {outputMatches.length > 0 ? (
                <ul className="flex max-h-64 flex-col gap-2 overflow-y-auto">
                  {outputMatches.slice(0, 500).map((match, index) => (
                    <li
                      key={`${match.index}-${index}`}
                      className="rounded-lg border border-border px-3 py-2 text-sm"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-mono text-xs text-muted-foreground">
                          #{index + 1} @ {match.index}
                        </span>
                      </div>
                      <code className="mt-1 block font-mono text-[13px]">{match.text}</code>
                      {match.groups.length > 0 ? (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {match.groups.map((groupValue, groupIndex) => (
                            <span
                              key={groupIndex}
                              className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground"
                            >
                              {groupIndex + 1}: {groupValue ?? "(no match)"}
                            </span>
                          ))}
                          {Object.entries(match.namedGroups).map(([name, value]) => (
                            <span
                              key={name}
                              className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground"
                            >
                              {name}: {value ?? "(no match)"}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-muted-foreground">No matches.</p>
              )}
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  )
}
