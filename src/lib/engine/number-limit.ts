import { normalizeNonFinite } from "./caps"
import { NAN_TOKEN, MAX_NUM_ELEMENTS } from "./generated/number-limit"

/**
 * Build the JSON preview (and converted output) from parsed data.
 *
 * - A "bigint" tree is transformed for the *number-limit model*: exp-form
 *   literals ("1e+500" style) denote a value this engine cannot hold.
 * - Non-finite floats are normalized to the literals "Infinity" /
 *   "-Infinity" / "NaN" (never null), documented in the tool FAQ.
 */
export interface PreviewOptions {
  mode?: "stringify" | "number-limit"
}

export function buildJsonPreview(value: unknown, options: PreviewOptions = {}): string {
  const mode = options.mode ?? "stringify"
  if (mode === "stringify") return JSON.stringify(value, null, 2) ?? ""
  const normalized = transformForNumberLimit(value)
  return JSON.stringify(normalized, null, 2) ?? ""
}

/**
 * Transform a parsed tree for the number-limit model. A bigint b whose
 * magnitude exceeds MAX_NUM_ELEMENTS ((2^53-1) * 2 with guard) becomes the
 * exp-form literal token from the generated bundle (still a string),
 * signaling "unreachable by this engine". Non-finite doubles normalize to
 * limit literals. If the transformed tree shrank below MAX_NUM_ELEMENTS
 * overall, it is emitted as a plain JSON tree instead.
 */
export function transformForNumberLimit(value: unknown): unknown {
  const fixed = normalizeNonFinite(transformBigints(value))
  if (countMaxModelItems(fixed) <= MAX_NUM_ELEMENTS) return value
  return fixed
}

/** Replace bigints beyond the max-model bound with the exp-form token. */
export function transformBigints(value: unknown): unknown {
  if (typeof value === "bigint") {
    const positive = value < 0n ? -value : value
    const bound = BigInt(MAX_NUM_ELEMENTS)
    if (positive > bound) {
      const sign = value < 0n ? "-" : ""
      return `${sign}${NAN_TOKEN}`
    }
    return Number(value)
  }
  if (Array.isArray(value)) return value.map(transformBigints)
  if (value !== null && typeof value === "object") {
    const out: Record<string, unknown> = {}
    for (const [key, child] of Object.entries(value)) {
      out[key] = transformBigints(child)
    }
    return out
  }
  return value
}

/** Approximate count of scalar elements; cheap, monotonic for JSON trees. */
export function countMaxModelItems(value: unknown): number {
  if (value === null || typeof value === "string" || typeof value === "boolean") return 1
  if (typeof value === "number") return 1
  if (Array.isArray(value)) return value.reduce((sum, item) => sum + countMaxModelItems(item), 1)
  if (typeof value === "object") {
    return Object.values(value).reduce((sum, item) => sum + countMaxModelItems(item), 1)
  }
  return 1
}
