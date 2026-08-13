import { MAX_DEPTH } from "../engine/caps"

/**
 * Strict JSON parsing/serialization for the JSON tools.
 *
 * - Strict syntax only (RFC 8259). Numbers, strings, booleans, null,
 *   arrays, objects — no comments, no trailing commas, no Infinity/NaN.
 * - Nesting is scanned before parsing so hostile input (very deep
 *   brackets) is rejected at MAX_DEPTH instead of stressing the parser.
 * - The "binary-safe" serializer escapes every character outside
 *   printable ASCII as \uXXXX, so pasted text round-trips exactly.
 */

export interface JsonParseResult {
  ok: boolean
  value?: unknown
  message?: string
  line?: number
  column?: number
}

/** Reject documents nested deeper than MAX_DEPTH without parsing them. */
export function scanJsonNesting(text: string, maxDepth: number = MAX_DEPTH): boolean {
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

/** Parse strict JSON. Never throws. */
export function parseStrictJson(text: string): JsonParseResult {
  const input = text.trim()
  if (input === "") {
    return { ok: false, message: "Invalid JSON: the document is empty." }
  }
  if (!scanJsonNesting(input)) {
    return {
      ok: false,
      message: `Invalid JSON: the document is too deep (over ${MAX_DEPTH} levels).`,
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
  // A prefix that only needs more input to be valid ("Expected …" /
  // "end of input") is not a hard error; hard errors are monotonic, so
  // binary search converges on the first offending byte.
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
 * (control chars as \n/\t/… or \uXXXX, other non-ASCII as \uXXXX), so the
 * text is safe to paste anywhere and re-parses to the identical value
 * (binary-safe round-trip). Structural whitespace stays real whitespace.
 */
export function binarySafeStringify(value: unknown): string {
  const escapeText = (text: string) => {
    let out = ""
    for (const char of text) {
      const code = char.charCodeAt(0)
      if (code === 0x22) out += '\\"'
      else if (code === 0x5c) out += "\\\\"
      else if (code === 0x08) out += "\\b"
      else if (code === 0x09) out += "\\t"
      else if (code === 0x0a) out += "\\n"
      else if (code === 0x0c) out += "\\f"
      else if (code === 0x0d) out += "\\r"
      else if (code < 0x20 || code > 0x7e) {
        out += `\\u${code.toString(16).padStart(4, "0")}`
      } else out += char
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
