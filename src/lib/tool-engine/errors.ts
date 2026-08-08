import type { ToolExecutionError, ToolValidationIssue } from "./types"
import { ToolExecutionError as ToolError } from "./types"
import { firstIssueMessage, zodIssuesToIssues } from "./validation"

/**
 * Centralized error handling.
 *
 * Every failure surfaces as a `ToolExecutionError` with a user-safe
 * message and a normalized issue list. Raw exceptions are never leaked to
 * the UI, and stack traces never reach the renderer.
 */

export const GENERIC_MESSAGE = "Something went wrong while running this tool. Please try again."

/** Convert any thrown value into a safe, typed error for rendering. */
export function toToolError(error: unknown): ToolExecutionError {
  if (error instanceof ToolError) return error

  if (isZodErrorLike(error)) {
    const issues = zodIssuesToIssues(error.issues ?? [])
    return new ToolError("VALIDATION", firstIssueMessage(issues), issues, error)
  }

  if (isErrorLike(error)) {
    return new ToolError("UNKNOWN", GENERIC_MESSAGE, [], error)
  }

  return new ToolError("UNKNOWN", GENERIC_MESSAGE)
}

/** Build a "human first" message from issues, preferring the first issue. */
export function formatIssuesForDisplay(issues: readonly ToolValidationIssue[]): string {
  if (issues.length === 0) return GENERIC_MESSAGE
  const first = issues[0]
  return issues.length === 1 ? first.message : `${first.message} (and ${issues.length - 1} more.)`
}

interface ZodErrorLike {
  name?: unknown
  issues?: { path: (string | number)[]; message: string }[]
}

function isZodErrorLike(value: unknown): value is ZodErrorLike {
  if (typeof value !== "object" || value === null) return false
  const candidate = value as ZodErrorLike
  return Array.isArray(candidate.issues)
}

function isErrorLike(value: unknown): value is { name: string; message: string } {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as { message?: unknown }).message === "string"
  )
}
