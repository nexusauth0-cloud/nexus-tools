/**
 * Shared JSON parsing utilities for engine-backed tools.
 *
 * `parseJsonWithLocation` normalizes V8 syntax errors into a single
 * stable message that includes a 1-based line/column, so every JSON tool
 * reports identical, friendly validation feedback.
 *
 * `parseStrictJson` accepts exactly RFC 8259 (no comments, no trailing
 * commas, no Infinity/NaN), rejects hostile nesting at MAX_JSON_DEPTH
 * before parsing, and reports the first offending byte with
 * line/column coordinates when the engine can locate it.
 */

/** Deepest JSON nesting accepted by the strict parser and tools. */
export const MAX_JSON_DEPTH = 100

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

/** Reject documents nested deeper than maxDepth without parsing them. */
export function scanJsonNesting(text: string, maxDepth: number = MAX_JSON_DEPTH): boolean {
  let depth = 0
  let inString = false
  let escaped = false
  for (const char of text) {
    if (inString) {
      if (escaped) {
        escaped = false
      } else if (char === "\\") {
        escaped = true
      } else if (char === '"') {
        inString = false
      }
      continue
    }
    if (char === '"') {
      inString = true
    } else if (char === "{" || char === "[") {
      depth += 1
      if (depth > maxDepth) return false
    } else if (char === "}" || char === "]") {
      // An unbalanced closer cannot grow nesting; let the parser report it.
      depth = Math.max(0, depth - 1)
    }
  }
  return true
}

/**
 * Parse strict JSON (RFC 8259 only). Never throws.
 * Rejects empty input, comments, trailing commas, single quotes, and
 * documents nested deeper than MAX_JSON_DEPTH.
 */
export function parseStrictJson(text: string): JsonParseResult {
  const input = text.trim()
  if (input === "") {
    return { ok: false, message: "Invalid JSON: the document is empty." }
  }
  if (!scanJsonNesting(input)) {
    return {
      ok: false,
      message: `Invalid JSON: the document is too deep (over ${MAX_JSON_DEPTH} levels).`,
    }
  }
  try {
    const value = JSON.parse(input)
    return { ok: true, value }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    const positionMatch = message.match(/(?:at )?position (\d+)/)
    const tokenMatch = message.match(/[Uu]nexpected token '(.?)'/)
    let position: number | undefined
    if (positionMatch) {
      position = Number(positionMatch[1])
    } else if (tokenMatch?.[1]) {
      position = input.indexOf(tokenMatch[1])
    } else {
      position = locateFirstError(input)
    }
    let line: number | undefined
    let column: number | undefined
    if (position !== undefined && position >= 0) {
      const prefix = input.slice(0, position)
      line = prefix.split("\n").length
      const lastNewline = prefix.lastIndexOf("\n")
      column = position - lastNewline
    }
    const reason = message
      .split("\n")[0]
      .split(" in JSON")[0]
      .replace(/^Unexpected/, "unexpected")
    return { ok: false, message: `Invalid JSON: ${reason}.`, line, column }
  }
}

/**
 * Newer V8 messages omit absolute positions; find the first byte where the
 * input stops being JSON by binary search over prefixes. Hard syntax
 * errors are monotonic (once a prefix hard-fails, every longer prefix
 * does), while "unexpected end of input" counts as not-yet-invalid, so
 * the search converges to the first offending byte.
 */
function locateFirstError(text: string): number | undefined {
  const isHardError = (length: number) => {
    try {
      JSON.parse(text.slice(0, length))
      return false
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      return !/expected |end of (json )?input/i.test(message)
    }
  }
  let low = 0
  let high = text.length
  let steps = 0
  if (!isHardError(high)) return undefined
  while (low < high && steps < 64) {
    const mid = Math.ceil((low + high) / 2)
    if (isHardError(mid)) {
      high = mid
    } else {
      low = mid
    }
    steps += 1
  }
  return low
}

export interface JsonFormatResult {
  ok: boolean
  output?: string
  message?: string
}

/** Format or minify strict JSON text. Never throws. */
export function formatJsonText(
  text: string,
  mode: "format" | "minify" = "format"
): JsonFormatResult {
  const parsed = parseStrictJson(text)
  if (!parsed.ok) return { ok: false, message: parsed.message }
  if (mode === "minify") {
    const minified = JSON.stringify(parsed.value)
    return minified === undefined
      ? { ok: false, message: "Invalid JSON: the document is empty." }
      : { ok: true, output: minified }
  }
  return { ok: true, output: JSON.stringify(parsed.value, null, 2) }
}

/**
 * Serialize a value with every character outside printable ASCII escaped
 * (control chars as \n/\t/… or \uXXXX, other non-ASCII BMP chars as
 * \uXXXX), so the text is safe to paste anywhere and re-parses to the
 * identical value (binary-safe round-trip). Astral characters (emoji and
 * other supplementary-plane text) are kept as literal UTF-16 pairs —
 * escaping each surrogate half separately would not survive JSON.parse —
 * while lone surrogates are still escaped. Structural whitespace stays
 * real whitespace.
 */
export function binarySafeStringify(value: unknown): string {
  const escapeText = (text: string) => {
    let out = ""
    for (let index = 0; index < text.length; index += 1) {
      const unit = text.charCodeAt(index)
      const nextUnit = text.charCodeAt(index + 1)
      if (unit >= 0xd800 && unit <= 0xdbff && nextUnit >= 0xdc00 && nextUnit <= 0xdfff) {
        out += text[index] + text[index + 1]
        index += 1
        continue
      }
      const code = unit
      if (code === 0x22) out += '\\"'
      else if (code === 0x5c) out += "\\\\"
      else if (code === 0x08) out += "\\b"
      else if (code === 0x09) out += "\\t"
      else if (code === 0x0a) out += "\\n"
      else if (code === 0x0c) out += "\\f"
      else if (code === 0x0d) out += "\\r"
      else if (code < 0x20 || code > 0x7e) {
        out += `\\u${code.toString(16).padStart(4, "0")}`
      } else out += text[index]
    }
    return out
  }

  const stringify = (item: unknown, depth: number): string => {
    const pad = "  ".repeat(depth)
    if (typeof item === "string") return `"${escapeText(item)}"`
    if (typeof item === "number" || typeof item === "boolean" || item === null) {
      return String(item)
    }
    if (Array.isArray(item)) {
      if (item.length === 0) return "[]"
      const inner = item.map((child) => `${pad}  ${stringify(child, depth + 1)}`).join(",\n")
      return `[\n${inner}\n${pad}]`
    }
    if (typeof item === "object") {
      const entries = Object.entries(item)
      if (entries.length === 0) return "{}"
      const inner = entries
        .map(([key, child]) => `${pad}  "${escapeText(key)}": ${stringify(child, depth + 1)}`)
        .join(",\n")
      return `{\n${inner}\n${pad}}`
    }
    return "null"
  }

  return stringify(value, 0)
}

interface JsonCounts {
  objects: number
  arrays: number
  strings: number
  numbers: number
  booleans: number
  nulls: number
  maxDepth: number
}

function countJson(value: unknown, depth = 1): JsonCounts {
  const counts: JsonCounts = {
    objects: 0,
    arrays: 0,
    strings: 0,
    numbers: 0,
    booleans: 0,
    nulls: 0,
    maxDepth: depth,
  }
  const walk = (item: unknown, currentDepth: number): void => {
    counts.maxDepth = Math.max(counts.maxDepth, currentDepth)
    if (Array.isArray(item)) {
      counts.arrays += 1
      for (const child of item) walk(child, currentDepth + 1)
    } else if (item !== null && typeof item === "object") {
      counts.objects += 1
      for (const child of Object.values(item)) walk(child, currentDepth + 1)
    } else if (typeof item === "string") {
      counts.strings += 1
    } else if (typeof item === "number") {
      counts.numbers += 1
    } else if (typeof item === "boolean") {
      counts.booleans += 1
    } else {
      counts.nulls += 1
    }
  }
  walk(value, depth)
  return counts
}

/** Human summary of a JSON document's contents, e.g. "1 object, 1 array". */
export function describeJsonCounts(value: unknown): string {
  const counts = countJson(value)
  const parts: string[] = []
  if (counts.objects) parts.push(`${counts.objects} object${counts.objects === 1 ? "" : "s"}`)
  if (counts.arrays) parts.push(`${counts.arrays} array${counts.arrays === 1 ? "" : "s"}`)
  if (counts.strings) parts.push(`${counts.strings} string${counts.strings === 1 ? "" : "s"}`)
  if (counts.numbers) parts.push(`${counts.numbers} number${counts.numbers === 1 ? "" : "s"}`)
  if (counts.booleans) parts.push(`${counts.booleans} boolean${counts.booleans === 1 ? "" : "s"}`)
  if (counts.nulls) parts.push(`${counts.nulls} null`)
  const summary = parts.length ? parts.join(", ") : "a single value"
  return `Valid JSON: ${summary} (deepest ${counts.maxDepth} level${counts.maxDepth === 1 ? "" : "s"}).`
}
