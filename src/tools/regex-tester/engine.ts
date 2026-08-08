import { z } from "zod"
import { createToolEngine, ToolExecutionError } from "@/lib/tool-engine"

/**
 * Regex Tester engine — the pure matching core shared by the live
 * preview and the explicit "run" flow. Only JavaScript RegExp is used;
 * user input is never executed. Matches are capped so a pathological
 * pattern cannot flood the UI.
 */

export const REGEX_FLAGS = ["g", "i", "m", "s", "u", "y"] as const
export type RegexFlag = (typeof REGEX_FLAGS)[number]

export interface RegexMatch {
  /** Index of the match inside the test string. */
  index: number
  /** The full matched text. */
  text: string
  /** Capture groups: text, or null for a group that did not participate. */
  groups: Array<string | null>
  /** Named groups, when the pattern uses (?<name>…). */
  namedGroups: Record<string, string | undefined>
}

export interface RegexOutput {
  pattern: string
  flags: string
  /** The test string the pattern ran against. */
  input: string
  matches: RegexMatch[]
  matchCount: number
}

export const MAX_REGEX_MATCHES = 10_000

const schema = z.object({
  pattern: z
    .string()
    .trim()
    .min(1, "Enter a regular expression.")
    .max(2_000, "Pattern is too long."),
  flags: z.string().max(6, "Too many flags."),
  input: z.string().min(0).max(1_000_000, "Test string is too large."),
})

/**
 * Build a RegExp from a pattern and flags. Returns the error message for
 * invalid expressions instead of throwing, so callers can render it.
 */
export function compilePattern(pattern: string, flags: string): RegExp | string {
  try {
    return new RegExp(pattern, flags)
  } catch (error) {
    return error instanceof Error ? error.message : "Invalid regular expression."
  }
}

/** Flags a browser actually supports (sticky/y/unicode/u need feature detection). */
export function supportedFlags(): RegexFlag[] {
  const supported: RegexFlag[] = []
  for (const flag of REGEX_FLAGS) {
    try {
      new RegExp("x", flag)
      supported.push(flag)
    } catch {
      // flag unsupported in this engine — skip
    }
  }
  return supported
}

/** Collect matches (non-overlapping, like String.prototype.match with /g). */
export function findMatches(pattern: RegExp, input: string): RegexMatch[] {
  const matches: RegexMatch[] = []
  const remaining = input

  while (true) {
    const match = pattern.exec(remaining)
    if (match === null) break

    matches.push({
      index: match.index,
      text: match[0],
      groups: match.slice(1).map((group) => (group === undefined ? null : group)),
      namedGroups: (match.groups ?? {}) as Record<string, string | undefined>,
    })

    if (matches.length >= MAX_REGEX_MATCHES) break

    if (match[0].length === 0) {
      // Zero-length match — advance manually to avoid an infinite loop.
      pattern.lastIndex += 1
    }
  }

  return matches
}

export const regexTesterEngine = createToolEngine<typeof schema, RegexOutput>({
  toolId: "regex-tester",
  schema,
  process: ({ pattern: patternSource, flags, input }) => {
    const compiled = compilePattern(patternSource, flags)
    if (typeof compiled === "string") {
      throw new ToolExecutionError("VALIDATION", `Invalid regular expression: ${compiled}`)
    }

    const matches = findMatches(compiled, input)

    return {
      pattern: patternSource,
      flags,
      input,
      matches,
      matchCount: matches.length,
    }
  },
  summarize: {
    input: (value) => `${value.pattern}/${value.flags}`,
    output: (value) =>
      value.matches.length === 1 ? "1 match" : `${value.matches.length.toLocaleString()} matches`,
  },
})
