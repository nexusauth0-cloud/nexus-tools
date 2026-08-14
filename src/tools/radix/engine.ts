import { z } from "zod"
import { createToolEngine, summarize, textField, ToolExecutionError } from "@/lib/tool-engine"
import { convertRadix, RADIX_BASES } from "@/lib/data/number-base"

/**
 * Number base converter engine (bases 2–36).
 *
 * Parse rule (documented in the tool UI and FAQ):
 *   - 0x / 0b / 0o prefixes force hex/binary/octal
 *   - a letter forces the smallest base that contains it ("ff" → hex)
 *   - bare digits are read as decimal
 * The output lists every base in structured blocks (2, 8, 10, 16
 * highlighted) plus the full 2–36 table, and the guessed parse reason.
 */

export interface RadixInput {
  number: string
}

export interface RadixBlock {
  label: string
  text: string
}

export interface RadixOutput {
  /** Primary result, e.g. "ff (hex)". */
  text: string
  /** Key bases first, then the full 2–36 table block. */
  blocks: RadixBlock[]
  decimal: string
  /** Why the input base was guessed ("read as decimal", "0x prefix"…). */
  reason: string
}

const REASON_LABELS: Record<string, string> = {
  dec: "read as decimal",
  "hex-prefix": "0x prefix",
  "bin-prefix": "0b prefix",
  "oct-prefix": "0o prefix",
  letter: "read by its letters (hex)",
}

const schema = z.object({
  number: textField({ min: 1, max: undefined }),
})

export const radixEngine = createToolEngine<typeof schema, RadixOutput>({
  toolId: "radix",
  schema,
  process: ({ number }) => {
    const result = convertRadix(number)
    if (!result.ok) {
      throw new ToolExecutionError("VALIDATION", result.message ?? "Enter an integer.")
    }
    const values = result.values!
    const keyBases: RadixBlock[] = [
      { label: "Binary (base 2)", text: values[2] },
      { label: "Octal (base 8)", text: values[8] },
      { label: "Decimal (base 10)", text: values[10] },
      { label: "Hex (base 16)", text: values[16] },
    ]
    const fullTable = RADIX_BASES.map(
      (base) => `${String(base).padStart(2)}: ${values[base]}`
    ).join("\n")

    return {
      text: `${values[16]} (hex)`,
      blocks: [...keyBases, { label: "All bases 2–36", text: fullTable }],
      decimal: String(result.decimal),
      reason: REASON_LABELS[result.reason ?? "dec"] ?? "read as decimal",
    }
  },
  summarize: {
    input: (value) => summarize(value.number),
    output: (value) => `${value.text} · decimal ${value.decimal}`,
  },
})
