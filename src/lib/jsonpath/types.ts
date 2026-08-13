/**
 * JSONPath AST types for the constrained, documented subset this project
 * supports. The tool manifest documents the full supported syntax.
 */

export type LiteralValue = string | number | boolean | null

/**
 * Every node (except root) carries `next` — the rest of the path chain —
 * so evaluation is a simple linked-list walk. Recursive-descent nodes embed
 * a `selector` sub-chain applied to every descendant.
 */
export type JsonPathNode =
  | { kind: "root"; next: JsonPathNode | null }
  | { kind: "child"; name: string; next: JsonPathNode | null }
  | { kind: "index"; index: number; next: JsonPathNode | null }
  | { kind: "wildcard"; next: JsonPathNode | null }
  | { kind: "recursive"; selector: JsonPathNode | null; next: JsonPathNode | null }
  | {
      kind: "slice"
      start: number | null
      end: number | null
      step: number
      next: JsonPathNode | null
    }
  | { kind: "union"; members: Array<string | number>; next: JsonPathNode | null }
  | { kind: "filter"; expression: FilterExpression; next: JsonPathNode | null }

export type FilterExpression =
  | { kind: "or"; left: FilterExpression; right: FilterExpression }
  | { kind: "and"; left: FilterExpression; right: FilterExpression }
  | { kind: "not"; operand: FilterExpression }
  | {
      kind: "compare"
      op: "==" | "!=" | "<" | "<=" | ">" | ">="
      left: FilterOperand
      right: FilterOperand
    }
  | { kind: "truthy"; operand: FilterOperand }

export type FilterOperand =
  | { kind: "literal"; value: LiteralValue }
  | { kind: "current" }
  | {
      kind: "path"
      segments: Array<{ kind: "name"; name: string } | { kind: "index"; index: number }>
    }

export interface JsonPathMatch {
  /** Canonical path of the match, e.g. `$.store.book[0].author`. */
  path: string
  value: unknown
  /** JSON representation for display (distinct from the raw string value). */
  json: string
}

export interface JsonPathLimits {
  /** Hard visited-node budget; exceeded → graceful error, never silent truncation. */
  maxVisits: number
  /** Maximum results carried before failing gracefully. */
  maxResults: number
}

export const DEFAULT_JSONPATH_LIMITS: JsonPathLimits = {
  maxVisits: 250_000,
  maxResults: 5_000,
}

export type JsonPathErrorCode = "SYNTAX" | "LIMIT" | "UNSUPPORTED"

export class JsonPathError extends Error {
  readonly code: JsonPathErrorCode
  constructor(code: JsonPathErrorCode, message: string) {
    super(message)
    this.name = "JsonPathError"
    this.code = code
  }
}

export const JSONPATH_MAX_EXPRESSION_CHARS = 400
export const JSONPATH_MAX_JSON_CHARS = 1_000_000
export const JSONPATH_MAX_DEPTH = 200
