"use client"

import { useMemo } from "react"
import type { ToolInputSchema } from "../types"
import { firstIssueMessage, runSchemaValidation } from "../validation"

/**
 * Live validation for an ad-hoc value against a schema — useful for
 * validate-in-place form feedback before a full engine run.
 */
export function useValidation<TSchema extends ToolInputSchema>(
  schema: TSchema,
  value: Record<string, unknown>
) {
  const result = useMemo(() => runSchemaValidation(schema, value), [schema, value])
  return {
    ok: result.ok,
    issues: result.issues,
    firstIssue: firstIssueMessage(result.issues),
  }
}
