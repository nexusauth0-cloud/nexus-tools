import {
  DEFAULT_JSONPATH_LIMITS,
  JsonPathError,
  type FilterExpression,
  type FilterOperand,
  type JsonPathLimits,
  type JsonPathMatch,
  type JsonPathNode,
} from "./types"

/**
 * JSONPath evaluator — walks the parsed AST against plain JSON data.
 *
 * The evaluator treats the document as data only: no code execution, no
 * prototype mutation (read-only own-property access), no `eval`. Work is
 * bounded by a visited-node budget so pathological expressions fail
 * gracefully with an explanation instead of freezing the browser — and the
 * failure is explicit, never a silent truncation.
 */

interface WalkContext {
  matches: JsonPathMatch[]
  visits: number
  limits: JsonPathLimits
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value)
}

function ownKeys(object: Record<string, unknown>): string[] {
  return Object.keys(object)
}

/** Read an own property; prototype keys stay ordinary data. */
function readOwn(object: Record<string, unknown>, key: string): unknown {
  return Object.prototype.hasOwnProperty.call(object, key) ? object[key] : undefined
}

function visit(ctx: WalkContext): void {
  ctx.visits++
  if (ctx.visits > ctx.limits.maxVisits) {
    throw new JsonPathError(
      "LIMIT",
      "This query visits too many nodes for the browser to process safely. Simplify the expression — for example, replace a deep `$..x` with a direct path — and try again."
    )
  }
}

function pushMatch(ctx: WalkContext, path: string, value: unknown): void {
  if (ctx.matches.length >= ctx.limits.maxResults) {
    throw new JsonPathError(
      "LIMIT",
      `This query matches more than ${ctx.limits.maxResults} values. Narrow the expression — for example, use an index or filter — and try again.`
    )
  }
  ctx.matches.push({ path, value, json: toJson(value) })
}

function toJson(value: unknown): string {
  try {
    return JSON.stringify(value) ?? String(value)
  } catch {
    return String(value)
  }
}

function formatKey(key: string): string {
  return /^[a-zA-Z_$][a-zA-Z0-9_$-]*$/.test(key) ? `.${key}` : `['${key}']`
}

function formatIndex(index: number): string {
  return `[${index}]`
}

/** Apply a node chain to a value, collecting matches. */
export function evaluate(
  document: unknown,
  ast: JsonPathNode,
  limits: JsonPathLimits = DEFAULT_JSONPATH_LIMITS
): JsonPathMatch[] {
  const ctx: WalkContext = { matches: [], visits: 0, limits }
  applyNode(document, ast, "$", ctx)
  return ctx.matches
}

function applyNode(value: unknown, node: JsonPathNode, path: string, ctx: WalkContext): void {
  visit(ctx)

  if (node.kind === "root") {
    if (node.next) {
      applyNode(value, node.next, "$", ctx)
    } else {
      pushMatch(ctx, "$", value)
    }
    return
  }

  if (node.kind === "child") {
    if (isObject(value) && readOwn(value, node.name) !== undefined) {
      const child = value[node.name]
      const nextPath = path + formatKey(node.name)
      continueChain(child, node.next, nextPath, ctx)
    }
    return
  }

  if (node.kind === "index") {
    if (isArray(value)) {
      const index = normalizeIndex(node.index, value.length)
      if (index !== null && value[index] !== undefined) {
        continueChain(value[index], node.next, path + formatIndex(index), ctx)
      }
    }
    return
  }

  if (node.kind === "wildcard") {
    if (isArray(value)) {
      for (let i = 0; i < value.length; i++) {
        continueChain(value[i], node.next, path + formatIndex(i), ctx)
      }
    } else if (isObject(value)) {
      for (const key of ownKeys(value)) {
        continueChain(value[key], node.next, path + formatKey(key), ctx)
      }
    }
    return
  }

  if (node.kind === "slice") {
    if (!isArray(value)) return
    const indices = sliceIndices(node.start, node.end, node.step, value.length)
    for (const index of indices) {
      if (value[index] === undefined) continue
      continueChain(value[index], node.next, path + formatIndex(index), ctx)
    }
    return
  }

  if (node.kind === "union") {
    if (isArray(value)) {
      for (const member of node.members) {
        if (typeof member !== "number") continue
        const index = normalizeIndex(member, value.length)
        if (index !== null && value[index] !== undefined) {
          continueChain(value[index], node.next, path + formatIndex(index), ctx)
        }
      }
    } else if (isObject(value)) {
      for (const member of node.members) {
        if (typeof member !== "string") continue
        if (readOwn(value, member) !== undefined) {
          continueChain(value[member], node.next, path + formatKey(member), ctx)
        }
      }
    }
    return
  }

  if (node.kind === "filter") {
    if (!isArray(value)) return
    for (let i = 0; i < value.length; i++) {
      const element = value[i]
      const passes = evalFilter(node.expression, element)
      if (passes) {
        continueChain(element, node.next, path + formatIndex(i), ctx)
      }
    }
    return
  }

  if (node.kind === "recursive") {
    const descendants = collectDescendants(value)
    for (const descendant of descendants) {
      visit(ctx)
      const selector = node.selector
      if (!selector) continue
      applyNode(descendant.value, selector, descendant.path, ctx)
    }
    return
  }
}

function continueChain(
  value: unknown,
  next: JsonPathNode | null,
  path: string,
  ctx: WalkContext
): void {
  if (next) {
    applyNode(value, next, path, ctx)
  } else {
    pushMatch(ctx, path, value)
  }
}

/** Non-root descendants in document order (recursive descent does not include the root itself). */
function collectDescendants(root: unknown): Array<{ value: unknown; path: string }> {
  const out: Array<{ value: unknown; path: string }> = []
  const walk = (value: unknown, path: string): void => {
    if (isArray(value)) {
      for (let i = 0; i < value.length; i++) {
        const childPath = path + formatIndex(i)
        out.push({ value: value[i], path: childPath })
        walk(value[i], childPath)
      }
    } else if (isObject(value)) {
      for (const key of ownKeys(value)) {
        const childPath = path + formatKey(key)
        out.push({ value: value[key], path: childPath })
        walk(value[key], childPath)
      }
    }
  }
  walk(root, "$")
  return out
}

/** Negative indices count from the end; out-of-range → null. */
function normalizeIndex(index: number, length: number): number | null {
  const normalized = index < 0 ? length + index : index
  return normalized >= 0 && normalized < length ? normalized : null
}

/** RFC-9535-style slice semantics with a clamped, finite result set. */
function sliceIndices(
  start: number | null,
  end: number | null,
  step: number,
  length: number
): number[] {
  const indices: number[] = []
  if (length === 0) return indices

  const clampIndex = (value: number, inclusiveEnd: boolean): number => {
    let normalized = value < 0 ? length + value : value
    normalized = Math.max(0, Math.min(normalized, length))
    if (!inclusiveEnd && normalized === length) return normalized
    return normalized
  }

  const stepIsPositive = step > 0
  const startIndex = start === null ? (stepIsPositive ? 0 : length - 1) : clampIndex(start, true)
  const endIndex = end === null ? (stepIsPositive ? length : -1) : clampIndex(end, false)

  if (stepIsPositive) {
    for (let i = startIndex; i < endIndex && i < length; i += step) indices.push(i)
  } else {
    for (let i = startIndex; i > endIndex && i >= 0; i += step) indices.push(i)
  }
  return indices
}

// ---- Filter evaluation -----------------------------------------------------------

/** Evaluate a filter expression against the current item (`@`). */
export function evalFilter(expression: FilterExpression, current: unknown): boolean {
  switch (expression.kind) {
    case "or":
      return evalFilter(expression.left, current) || evalFilter(expression.right, current)
    case "and":
      return evalFilter(expression.left, current) && evalFilter(expression.right, current)
    case "not":
      return !evalFilter(expression.operand, current)
    case "truthy":
      return isTruthy(resolveOperand(expression.operand, current))
    case "compare": {
      const left = resolveOperand(expression.left, current)
      const right = resolveOperand(expression.right, current)
      return compareValues(expression.op, left, right)
    }
  }
}

function resolveOperand(operand: FilterOperand, current: unknown): unknown {
  switch (operand.kind) {
    case "literal":
      return operand.value
    case "current":
      return current
    case "path": {
      let value = current
      for (const segment of operand.segments) {
        if (segment.kind === "name") {
          if (!isObject(value)) return undefined
          if (readOwn(value, segment.name) === undefined) return undefined
          value = value[segment.name]
        } else {
          if (!isArray(value)) return undefined
          const index = normalizeIndex(segment.index, value.length)
          if (index === null || value[index] === undefined) return undefined
          value = value[index]
        }
      }
      return value
    }
  }
}

function isTruthy(value: unknown): boolean {
  if (value === null || value === undefined) return false
  if (typeof value === "number") return value !== 0 && !Number.isNaN(value)
  if (typeof value === "string") return value.length > 0
  if (typeof value === "boolean") return value
  if (Array.isArray(value)) return value.length > 0
  if (isObject(value)) return ownKeys(value).length > 0
  return false
}

type CompareOp = "==" | "!=" | "<" | "<=" | ">" | ">="

/**
 * Type-aware comparison: values of different types never compare
 * numerically — no implicit coercion, matching RFC 9535 expectations.
 */
function compareValues(op: CompareOp, left: unknown, right: unknown): boolean {
  const lt = typeOf(left)
  const rt = typeOf(right)

  if (lt !== rt) {
    return op === "!=" ? true : op === "==" ? false : false
  }

  if (op === "==") return looseEqual(left, right)
  if (op === "!=") return !looseEqual(left, right)

  if (lt === "number") {
    const l = left as number
    const r = right as number
    return op === "<" ? l < r : op === "<=" ? l <= r : op === ">" ? l > r : l >= r
  }
  if (lt === "string") {
    const l = left as string
    const r = right as string
    return op === "<" ? l < r : op === "<=" ? l <= r : op === ">" ? l > r : l >= r
  }
  return false
}

function looseEqual(left: unknown, right: unknown): boolean {
  if (left === right) return true
  if (left === null || right === null) return left === right
  if (typeOf(left) === "number" && typeOf(right) === "number") {
    return Number.isNaN(left as number) && Number.isNaN(right as number) ? false : left === right
  }
  return false
}

function typeOf(value: unknown): "null" | "boolean" | "number" | "string" | "array" | "object" {
  if (value === null) return "null"
  if (Array.isArray(value)) return "array"
  return typeof value === "boolean"
    ? "boolean"
    : typeof value === "number"
      ? "number"
      : typeof value === "string"
        ? "string"
        : "object"
}
