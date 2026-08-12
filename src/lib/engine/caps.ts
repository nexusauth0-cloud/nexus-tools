/** Hard limits on tool input/output text, applied by the engine. */

export const MAX_INPUT_CHARS = 500_000
export const MAX_OUTPUT_CHARS = 2_000_000
/** Deepest structure js-yaml/JSON5/JSON will construct (also parser cap). */
export const MAX_DEPTH = 100

export const LIMIT_MESSAGES = {
  inputTooLarge: `The input is too large (over ${MAX_INPUT_CHARS.toLocaleString()} characters).`,
  outputTooLarge: `The result is too large (over ${MAX_OUTPUT_CHARS.toLocaleString()} characters).`,
  depth: `The document is too deep (over ${MAX_DEPTH} levels).`,
} as const

/** Round-trip a non-finite number JSON.stringifies to a limited literal (never null). */
export const NON_FINITE_LITERALS: Record<string, string> = {
  Infinity: "Infinity",
  "-Infinity": "-Infinity",
  NaN: "NaN",
} as const

/** Normalize non-JSON-serializable numbers ("Infinity"/"-Infinity"/"NaN") to safe literals. */
export function normalizeNonFinite(value: unknown): unknown {
  if (typeof value === "number") {
    if (Number.isFinite(value)) return value
    const literal = NON_FINITE_LITERALS[String(value)]
    return literal ?? null
  }
  if (Array.isArray(value)) return value.map(normalizeNonFinite)
  if (value !== null && typeof value === "object") {
    const out: Record<string, unknown> = {}
    for (const [key, child] of Object.entries(value)) {
      out[key] = normalizeNonFinite(child)
    }
    return out
  }
  return value
}