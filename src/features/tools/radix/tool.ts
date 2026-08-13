import { convertRadix, RADIX_BASES } from "@/lib/data/number-base"
import { registerDecoration } from "@/lib/registry/artwork"

/**
 * Number base converter (2–36).
 *
 * Parse rule (documented in the tool UI and FAQ):
 *   - 0x / 0b / 0o prefixes force hex/binary/octal
 *   - a letter forces the smallest base that contains it ("ff" → hex)
 *   - bare digits are read as decimal
 * Output lists every base in the main blocks (2, 8, 10, 16 highlighted)
 * plus a collapsible full 2–36 table.
 */

export interface RadixToolResult {
  ok: boolean
  output: string
  blocks?: Array<{ label?: string; text: string; code?: boolean }>
  info?: Record<string, string>
}

const REASON_LABELS: Record<string, string> = {
  dec: "read as decimal",
  "hex-prefix": "0x prefix",
  "bin-prefix": "0b prefix",
  "oct-prefix": "0o prefix",
  letter: "read by its letters (hex)",
}

export function run(input: string): RadixToolResult {
  const result = convertRadix(input)
  if (!result.ok) {
    return { ok: false, output: result.message ?? "Enter an integer." }
  }
  const values = result.values!
  const keyBases: Array<{ label: string; text: string; code?: boolean }> = [
    { label: "Binary (base 2)", text: values[2], code: true },
    { label: "Octal (base 8)", text: values[8], code: true },
    { label: "Decimal (base 10)", text: values[10], code: true },
    { label: "Hex (base 16)", text: values[16], code: true },
  ]
  const fullTable = RADIX_BASES.map((base) => `${String(base).padStart(2)}: ${values[base]}`).join(
    "\n"
  )

  return {
    ok: true,
    output: `${values[16]} (hex)`,
    blocks: [...keyBases, { label: `All bases 2–36`, text: fullTable, code: true }],
    info: {
      decimal: String(result.decimal),
      "guessed as": REASON_LABELS[result.reason ?? "dec"],
    },
  }
}

registerDecoration(
  "radix",
  ["   ff (hex)  =  255 (dec)", "   = 11111111 (bin)", "   = 377 (oct)", "   = ff (base 16)"].join(
    "\n"
  )
)

export const helpArt: string = [
  "╔══════════════════════════════════════╗",
  "║      Number base converter (2-36)    ║",
  "╚══════════════════════════════════════╝",
].join("\n")
