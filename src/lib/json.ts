/**
 * Shared JSON parsing utilities for engine-backed tools.
 *
 * `parseJsonWithLocation` normalizes V8 syntax errors into a single
 * stable message that includes a 1-based line/column, so every JSON tool
 * reports identical, friendly validation feedback.
 */

export interface JsonParseSuccess {
  ok: true
  value: unknown
}

export interface JsonParseFailure {
  ok: false
  /** User-safe message already containing line/column when available. */
  message: string
  /** 1-based line of the error, when the engine reports a position. */
  line?: number
  /** 1-based column of the error, when the engine reports a position. */
  column?: number
}

export type JsonParseResult = JsonParseSuccess | JsonParseFailure

/** Parse JSON text, normalizing the error with a line/column location. */
export function parseJsonWithLocation(text: string): JsonParseResult {
  try {
    return { ok: true, value: JSON.parse(text) }
  } catch (error) {
    const raw = error instanceof SyntaxError ? error.message : "Unexpected syntax error"
    const position = jsonErrorPosition(raw)
    if (position === null) {
      return { ok: false, message: `Invalid JSON: ${raw}` }
    }
    const { line, column } = positionToLineColumn(text, position)
    return {
      ok: false,
      message: `Invalid JSON on line ${line}, column ${column}: ${raw}`,
      line,
      column,
    }
  }
}

/** Extract the `at position N` offset from a V8 JSON.parse error message. */
export function jsonErrorPosition(message: string): number | null {
  const match = /[/ ]at position (\d+)/.exec(message)
  return match ? Number(match[1]) : null
}

/** Convert a byte offset in `text` to 1-based line/column coordinates. */
export function positionToLineColumn(
  text: string,
  position: number
): { line: number; column: number } {
  let line = 1
  let lineStart = 0
  const max = Math.min(position, text.length)
  for (let index = 0; index < max; index += 1) {
    if (text.charCodeAt(index) === 10) {
      line += 1
      lineStart = index + 1
    }
  }
  return { line, column: max - lineStart + 1 }
}

/** Number of top-level entries a parsed value exposes (arrays: length). */
export function countJsonEntries(value: unknown): number {
  if (Array.isArray(value)) return value.length
  if (typeof value === "object" && value !== null) {
    return Object.keys(value as Record<string, unknown>).length
  }
  return 1
}

/** UTF-8 byte size of a string; falls back to char length without Blob. */
export function byteSize(text: string): number {
  if (typeof Blob === "undefined") return text.length
  return new Blob([text]).size
}
