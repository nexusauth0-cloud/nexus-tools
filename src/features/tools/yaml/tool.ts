import { jsonToYaml, parseYamlText } from "@/lib/data/yaml"
import { normalizeNonFinite } from "@/lib/engine/caps"
import { registerDecoration } from "@/lib/registry/artwork"

/**
 * YAML ↔ JSON converter.
 *
 * Modes (param `direction`, default "to-json"):
 *   to-json  parse YAML (plain data only, YAML 1.2 core) → pretty JSON
 *   to-yaml  parse JSON → deterministic YAML (no refs, no tags)
 *
 * Non-finite numbers produced by YAML ("Infinity"/"NaN") normalize to the
 * literals "Infinity" / "-Infinity" / "NaN" (never null). The "<<" merge
 * key stays plain data, and "yes"/"no" remain strings — YAML 1.2 core.
 */

export interface YamlToolResult {
  ok: boolean
  output: string
  blocks?: Array<{ label?: string; text: string; code?: boolean }>
  info?: Record<string, string>
  line?: number
  column?: number
}

function describeShape(value: unknown): string {
  const count = (item: unknown): { keys: number; items: number } => {
    if (Array.isArray(item)) {
      const inner = item.reduce(
        (acc, child) => ({
          keys: acc.keys + count(child).keys,
          items: acc.items + count(child).items,
        }),
        { keys: 0, items: 0 }
      )
      return { keys: inner.keys, items: inner.items + 1 }
    }
    if (item !== null && typeof item === "object") {
      const inner = Object.values(item).reduce(
        (acc, child) => ({
          keys: acc.keys + count(child).keys,
          items: acc.items + count(child).items,
        }),
        { keys: 0, items: 0 }
      )
      return { keys: inner.keys + Object.keys(item).length, items: inner.items }
    }
    return { keys: 0, items: 0 }
  }
  const shape = count(value)
  const parts: string[] = []
  if (shape.keys) parts.push(`${shape.keys} key${shape.keys === 1 ? "" : "s"}`)
  if (shape.items) parts.push(`${shape.items} item${shape.items === 1 ? "" : "s"}`)
  return parts.length ? parts.join(", ") : "a single scalar"
}

export function run(input: string, params: Record<string, string>): YamlToolResult {
  const direction = (params["direction"] ?? "to-json") as "to-json" | "to-yaml"

  if (direction === "to-json") {
    const parsed = parseYamlText(input)
    if (!parsed.ok) {
      return { ok: false, output: parsed.message, line: parsed.line, column: parsed.column }
    }
    const output = JSON.stringify(normalizeNonFinite(parsed.value), null, 2) ?? ""
    return {
      ok: true,
      output,
      info: {
        "parsed as": "YAML",
        keys: describeShape(parsed.value),
      },
    }
  }

  const parsed = parseStrictJsonInput(input)
  if (!parsed.ok) {
    return { ok: false, output: parsed.message ?? "", line: parsed.line, column: parsed.column }
  }
  return { ok: true, output: jsonToYaml(parsed.value) }
}

function parseStrictJsonInput(input: string): {
  ok: boolean
  value?: unknown
  message?: string
  line?: number
  column?: number
} {
  const text = input.trim()
  if (text === "") return { ok: false, message: "Invalid JSON: the document is empty." }
  try {
    return { ok: true, value: JSON.parse(text) }
  } catch (error) {
    return {
      ok: false,
      message: `Invalid JSON: ${error instanceof Error ? error.message.split("\n")[0] : "could not parse."}`,
    }
  }
}

registerDecoration(
  "yaml",
  [
    "   ,----,    ,----,    ,----,",
    "   | Y  |    | A  |    | M  |",
    "   `----'    `----'    `----'",
    "     YAML    TO      JSON",
  ].join("\n")
)

export const helpArt: string = [
  "╔══════════════════════════════════════╗",
  "║       YAML ↔ JSON converter         ║",
  "╚══════════════════════════════════════╝",
].join("\n")
