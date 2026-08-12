import { constructFromEvents, dump as yamlDump, parseEvents, YAMLException } from "js-yaml"

/**
 * Bound, safe YAML parsing/serialization for the JSON ↔ YAML converter.
 *
 * Safety model (documented in the tool UI and FAQ):
 *
 * - Parsing goes through js-yaml's event API with construction limits:
 *   `maxDepth` stops nesting abuse, and `maxAliases` caps how many alias
 *   references may be resolved (alias-bomb protection). Input length and
 *   output size are additionally capped by the engine.
 * - Only plain-data YAML 1.2 core scalars/mappings/sequences are
 *   constructed. Custom or executable tags (!!js/*, !anything,
 *   !!python/*) are rejected outright, so no arbitrary class can be
 *   instantiated and nothing ever executes. Timestamps resolve to plain
 *   strings, so no Date objects can be produced.
 * - Dialect is YAML 1.2 core: "yes"/"no" stay strings, and the "<<"
 *   merge key is treated as plain data (never merged) — both documented
 *   in the tool FAQ.
 * - Output is deterministic: insertion order is preserved, refs/anchors
 *   are never emitted (noRefs), lines are never wrapped, and ambiguous
 *   scalars are quoted by the serializer so values round-trip.
 * - No eval, no Function, no document.exec — construction never runs
 *   user code by construction (see security tests).
 */

export const YAML_MAX_INPUT_CHARS = 400_000
export const YAML_MAX_DEPTH = 100
export const YAML_MAX_ALIASES = 128

export type JsonYamlDirection = "json-to-yaml" | "yaml-to-json"

export interface YamlParseFailure {
  ok: false
  /** User-safe message; never a stack trace. */
  message: string
  /** 1-based line of the error when the parser reports one. */
  line?: number
  /** 1-based column of the error when the parser reports one. */
  column?: number
}

export interface YamlParseSuccess {
  ok: true
  value: unknown
}

export type YamlParseResult = YamlParseSuccess | YamlParseFailure

/** Parse YAML as plain data. Never resolves custom tags; bounded. */
export function parseYamlText(text: string): YamlParseResult {
  try {
    const events = parseEvents(text, { maxDepth: YAML_MAX_DEPTH })
    const documents = constructFromEvents(events, {
      source: text,
      maxAliases: YAML_MAX_ALIASES,
    })
    if (documents.length === 0) {
      return { ok: false, message: "Invalid YAML: the document is empty." }
    }
    if (documents.length > 1) {
      return {
        ok: false,
        message:
          "Invalid YAML: multiple documents are not supported — place a single document per conversion.",
      }
    }
    return { ok: true, value: documents[0] }
  } catch (error) {
    if (error instanceof YAMLException) {
      const mark = error.mark
      const line = mark ? mark.line + 1 : undefined
      const column = mark ? mark.column + 1 : undefined
      const where =
        line !== undefined && column !== undefined ? ` on line ${line}, column ${column}` : ""
      const reason = error.reason ?? error.message.split("\n")[0]
      return { ok: false, message: `Invalid YAML: ${reason}${where}`, line, column }
    }
    return { ok: false, message: "Invalid YAML: the document could not be parsed." }
  }
}

/** Serialize plain JSON data to YAML. Deterministic; never emits tags/refs. */
export function jsonToYaml(value: unknown): string {
  return yamlDump(value, {
    noRefs: true,
    lineWidth: -1,
    indent: 2,
  })
}

/** True when the value graph contains a non-finite number (NaN/±Infinity). */
export function hasNonFiniteNumber(value: unknown): boolean {
  if (typeof value === "number") return !Number.isFinite(value)
  if (Array.isArray(value)) return value.some((item) => hasNonFiniteNumber(item))
  if (typeof value === "object" && value !== null) {
    return Object.values(value as Record<string, unknown>).some((item) => hasNonFiniteNumber(item))
  }
  return false
}