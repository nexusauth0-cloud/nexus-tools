import { z } from "zod"
import { createToolEngine, summarize, textField, ToolExecutionError } from "@/lib/tool-engine"
import { parseStrictJson } from "@/lib/json"
import { jsonToYaml, normalizeNonFinite, parseYamlText } from "@/lib/data/yaml"

/**
 * YAML ↔ JSON converter engine.
 *
 * Direction (param `direction`, default "to-json"):
 *   to-json  parse YAML (plain data only, YAML 1.2 core) → pretty JSON
 *   to-yaml  parse strict JSON → deterministic YAML (no refs, no tags)
 *
 * Non-finite numbers produced by YAML ("Infinity"/"NaN") normalize to the
 * literals "Infinity" / "-Infinity" / "NaN" (never null).
 */

export type YamlDirection = "to-json" | "to-yaml"

export interface YamlInput {
  yaml: string
  direction: YamlDirection
}

export interface YamlOutput {
  direction: YamlDirection
  text: string
  /** Short shape summary, e.g. "3 keys, 1 item". */
  shape: string
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

const schema = z.object({
  yaml: textField({ min: 1, max: undefined }),
  direction: z.enum(["to-json", "to-yaml"]).default("to-json"),
})

export const yamlEngine = createToolEngine<typeof schema, YamlOutput>({
  toolId: "yaml",
  schema,
  process: ({ yaml, direction }) => {
    if (direction === "to-json") {
      const parsed = parseYamlText(yaml)
      if (!parsed.ok) {
        throw new ToolExecutionError("VALIDATION", parsed.message)
      }
      return {
        direction,
        text: JSON.stringify(normalizeNonFinite(parsed.value), null, 2),
        shape: describeShape(parsed.value),
      }
    }

    const parsed = parseStrictJson(yaml)
    if (!parsed.ok) {
      throw new ToolExecutionError("VALIDATION", parsed.message)
    }
    return {
      direction,
      text: jsonToYaml(parsed.value),
      shape: describeShape(parsed.value),
    }
  },
  summarize: {
    input: (value) => summarize(value.yaml),
    output: (value) => `${value.direction} — ${value.shape}`,
  },
})
