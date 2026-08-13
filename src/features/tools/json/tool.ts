import { binarySafeStringify, formatJsonText, parseStrictJson } from "@/lib/data/json"
import { registerDecoration } from "@/lib/registry/artwork"

/**
 * JSON formatter / validator / minifier.
 *
 * Modes (param `mode`, default "format"):
 *   format   pretty-print with two-space indent, strict JSON only
 *   validate  summarize the document or report the first error
 *   minify    compact single-line JSON
 *   binary    format and escape every non-printable/non-ASCII char as
 *             \uXXXX so the result is safe to paste anywhere
 */

export type JsonMode = "format" | "validate" | "minify" | "binary"

export interface JsonToolResult {
  ok: boolean
  output: string
  line?: number
  column?: number
}
interface Counts {
  objects: number
  arrays: number
  strings: number
  numbers: number
  booleans: number
  nulls: number
  maxDepth: number
}

function countJson(value: unknown, depth = 1): Counts {
  const counts: Counts = {
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

function describeCounts(counts: Counts): string {
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

/** Canonical tool entry point: run(input, params) → ToolRunResult-compatible. */
export function run(input: string, params: Record<string, string>): JsonToolResult {
  const mode = (params["mode"] ?? "format") as JsonMode
  const parsed = parseStrictJson(input)
  if (!parsed.ok) {
    return { ok: false, output: parsed.message ?? "", line: parsed.line, column: parsed.column }
  }
  switch (mode) {
    case "validate":
      return { ok: true, output: describeCounts(countJson(parsed.value)) }
    case "minify": {
      const minified = formatJsonText(input, "minify")
      return minified.ok
        ? { ok: true, output: minified.output ?? "" }
        : { ok: false, output: minified.message ?? "" }
    }
    case "binary":
      return { ok: true, output: binarySafeStringify(parsed.value) }
    case "format":
    default:
      return { ok: true, output: JSON.stringify(parsed.value, null, 2) }
  }
}

registerDecoration(
  "json",
  [
    "     ,.=:!!t3Z3z.,",
    "    :tt:::tt333EE3",
    "    Et:::ztt33EEE  @Ee.,",
    "    ;:::#33EEEEEE :::##E3).",
    "    ;EEEEEEEEEEEE EEEEEEEEEEE;;",
    "    :88EEEEEEEEEE ::8888888888:",
    "     EEEEEEEEEEE8 ::8888888888;",
    "",
    "     > Merely JSON.",
  ].join("\n")
)

export const helpArt: string = [
  "╔══════════════════════════════════════╗",
  "║       JSON · format / minify         ║",
  "╚══════════════════════════════════════╝",
].join("\n")
