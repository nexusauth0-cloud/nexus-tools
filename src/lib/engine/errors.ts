/** User-facing messages for engine-level failures, keyed by errorCode. */

export interface NormalizedError {
  message: string
  line?: number
  column?: number
}

const KNOWN_CODES: Record<string, NormalizedError> = {
  "default/blank-input": { message: "Enter some input to convert." },
  "default/file-empty": { message: "The uploaded file is empty." },
  "tool/not-found": { message: "This tool does not exist (yet)." },
  "yaml/empty": { message: "Enter YAML to convert." },
  "yaml/multi-doc": {
    message: "Multiple YAML documents are not supported — place a single document per conversion.",
  },
  "csv/empty": { message: "Paste CSV with a header row to convert." },
  "json/empty": { message: "Enter JSON to convert." },
  "input/too-large": { message: "The input is too large (over 500,000 characters)." },
  "output/too-large": { message: "The result is too large (over 2,000,000 characters)." },
  "depth/too-deep": { message: "The document is too deep (over 100 levels)." },
}

/**
 * Normalize an error thrown by any tool into a stable, safe message.
 * Critical internal messages are rejected so no stack traces or
 * environment details ever leak to the user.
 */
export function normalizeError(error: unknown): NormalizedError {
  if (typeof error === "object" && error !== null && "ok" in error && error.ok === false) {
    const result = error as { message?: string }
    return { message: result.message ?? "The tool could not process this input." }
  }
  const raw = error instanceof Error ? error.message : String(error ?? "")
  const known = KNOWN_CODES[raw.trim()]
  if (known) return known
  if (/stack|SyntaxError|TypeError|RangeError|at file:/.test(raw)) {
    return { message: "The tool could not process this input." }
  }
  return { message: raw }
}