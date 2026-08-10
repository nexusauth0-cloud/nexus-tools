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
import type { RobotsRuleGroup } from "@/lib/url/robots"
import { robotsTxtCheckerEngine } from "./engine"
import { manifest } from "./manifest"

function GroupCard({ group }: { group: RobotsRuleGroup }) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border bg-background/60 p-3">
      <p className="font-mono text-[13px]">
        User-agent: <span className="font-semibold">{group.userAgent}</span>
      </p>
      {group.crawlDelay !== null ? (
        <p className="text-xs text-muted-foreground">Crawl-delay: {group.crawlDelay} seconds</p>
      ) : null}
      {group.allow.length > 0 ? (
        <ul className="flex flex-col gap-1">
          {group.allow.map((rule) => (
            <li key={`allow-${rule}`} className="break-all font-mono text-xs text-success">
              Allow: {rule}
            </li>
          ))}
        </ul>
      ) : null}
      {group.disallow.length > 0 ? (
        <ul className="flex flex-col gap-1">
          {group.disallow.map((rule) => (
            <li key={`disallow-${rule}`} className="break-all font-mono text-xs text-destructive">
              Disallow: {rule}
            </li>
          ))}
        </ul>
      ) : null}
      {group.allow.length === 0 && group.disallow.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          No rules — everything is allowed for this agent.
        </p>
      ) : null}
    </div>
  )
}

export default function RobotsTxtCheckerTool() {
  const [input, setInput] = useState("")
  const { status, result, error, run, reset } = useTool(robotsTxtCheckerEngine)

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
        aria-label="Robots.txt check form"
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
            {busy ? "Fetching robots.txt…" : "Check robots.txt"}
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
            <ResultCard title={`robots.txt · HTTP ${output.status}`}>
              <p className="break-all font-mono text-xs text-muted-foreground">
                {output.robotsUrl}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                {parsed.lines} lines · {parsed.comments} comment
                {parsed.comments === 1 ? "" : "s"} · {parsed.blankLines} blank
                {parsed.blankLines === 1 ? "" : "s"}
              </p>

              {output.warnings.length > 0 ? (
                <ul className="mt-3 flex flex-col gap-1">
                  {output.warnings.map((warning) => (
                    <li key={warning} className="text-xs text-destructive">
                      {warning}
                    </li>
                  ))}
                </ul>
              ) : null}

              <div className="mt-4 flex flex-col gap-3">
                {parsed.groups.map((group) => (
                  <GroupCard key={group.userAgent} group={group} />
                ))}
                {parsed.groups.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No user-agent groups in this file.
                  </p>
                ) : null}
              </div>
            </ResultCard>

            {parsed.sitemaps.length > 0 ? (
              <ResultCard title={`Sitemap references (${parsed.sitemaps.length})`}>
                <ul className="flex flex-col gap-2">
                  {parsed.sitemaps.map((sitemap) => (
                    <li key={sitemap} className="break-all font-mono text-[13px]">
                      {sitemap}
                    </li>
                  ))}
                </ul>
              </ResultCard>
            ) : null}

            {parsed.issues.length > 0 ? (
              <ResultCard title={`Issues (${parsed.issues.length})`}>
                <ul className="flex flex-col gap-2">
                  {parsed.issues.map((issue) => (
                    <li
                      key={`${issue.line}-${issue.issue}-${issue.detail}`}
                      className="flex items-baseline gap-2"
                    >
                      <Badge variant="destructive" className="shrink-0">
                        line {issue.line}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {issue.detail ?? issue.issue}
                      </span>
                    </li>
                  ))}
                </ul>
              </ResultCard>
            ) : null}

            <p className="text-xs text-muted-foreground">
              robots.txt is a convention for cooperative crawlers, not an access-control mechanism.
              Finding here says nothing about how any engine treats the file.
            </p>
          </>
        ) : null}
      </div>
    </div>
  )
}
