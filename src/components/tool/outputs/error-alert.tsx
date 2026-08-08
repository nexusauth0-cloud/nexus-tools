"use client"

import { AlertCircle } from "lucide-react"
import type { ToolExecutionError, ToolValidationIssue } from "@/lib/tool-engine"
import { formatIssuesForDisplay } from "@/lib/tool-engine"

interface ErrorAlertProps {
  /** Result-level error (bad input or processing failure). */
  error?: ToolExecutionError | null
  /** Field-level issues surfaced by a failed validation. */
  issues?: readonly ToolValidationIssue[]
  className?: string
}

/**
 * Accessible validation/error notice. Renders nothing when there is
 * nothing to report. Live region so screen readers announce updates.
 */
export function ErrorAlert({ error, issues = [], className }: ErrorAlertProps) {
  const items = issues && issues.length > 0 ? issues : error ? error.issues : []
  if (!error && items.length === 0) return null

  const message =
    error && items.length === 0 ? error.toUserMessage() : formatIssuesForDisplay(items)

  return (
    <div
      role="alert"
      aria-live="polite"
      className={
        "flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2.5 text-sm text-destructive " +
        (className ?? "")
      }
    >
      <AlertCircle className="mt-0.5 size-4 shrink-0" />
      <div className="space-y-0.5">
        <p className="font-medium">{message}</p>
        {items.length > 1 ? (
          <ul className="list-inside list-disc space-y-0.5 text-destructive/90">
            {items.map((issue) => (
              <li key={issue.field + issue.message}>
                {issue.field ? (
                  <span className="font-mono text-xs text-muted-foreground">{issue.field}: </span>
                ) : null}
                {issue.message}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  )
}
