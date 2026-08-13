/**
 * JSONPath — safe, documented-subset query engine.
 *
 * Public entry: `queryJsonPath(document, expression, limits?)`.
 * Throws JsonPathError (SYNTAX | LIMIT) on bad input or budget exhaustion.
 */
export * from "./types"
export { parseJsonPath } from "./parser"
export { evaluate } from "./evaluate"

import { parseJsonPath } from "./parser"
import { evaluate } from "./evaluate"
import {
  DEFAULT_JSONPATH_LIMITS,
  JsonPathError,
  JSONPATH_MAX_DEPTH,
  JSONPATH_MAX_JSON_CHARS,
  type JsonPathErrorCode,
  type JsonPathLimits,
  type JsonPathMatch,
} from "./types"

/** Depth cap guard so deeply nested JSON cannot blow the stack or the walk. */
export function checkJsonDepth(value: unknown, maxDepth: number, current = 1): number {
  if (current > maxDepth) return current
  if (Array.isArray(value)) {
    for (const item of value) {
      const depth = checkJsonDepth(item, maxDepth, current + 1)
      if (depth > maxDepth) return depth
    }
  } else if (typeof value === "object" && value !== null) {
    for (const key of Object.keys(value)) {
      const depth = checkJsonDepth((value as Record<string, unknown>)[key], maxDepth, current + 1)
      if (depth > maxDepth) return depth
    }
  }
  return current
}

export interface JsonPathQueryResult {
  ok: boolean
  matches: JsonPathMatch[]
  error?: { code: JsonPathErrorCode; message: string }
}

/** Query a JSON document, threading all caps through to the caller. */
export function queryJsonPath(
  document: unknown,
  expression: string,
  limits: JsonPathLimits = DEFAULT_JSONPATH_LIMITS
): JsonPathQueryResult {
  try {
    const ast = parseJsonPath(expression)
    const matches = evaluate(document, ast, limits)
    return { ok: true, matches }
  } catch (error) {
    if (error instanceof JsonPathError) {
      return { ok: false, matches: [], error: { code: error.code, message: error.message } }
    }
    throw error
  }
}

export { JsonPathError, JSONPATH_MAX_DEPTH, JSONPATH_MAX_JSON_CHARS }
