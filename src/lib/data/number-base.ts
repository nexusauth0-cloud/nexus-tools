// =====================================================================
// Radix conversion (base 2..36) for the "Number base converter".
//
// Parse rule (deterministic, documented in the tool UI):
//   - an explicit prefix forces the base: 0x hex, 0b binary, 0o octal
//   - otherwise any letter in the input forces the smallest base that
//     contains it ("ff" → hex, "zz" → base 36)
//   - otherwise (bare digits) the input is read as decimal
// =====================================================================

export interface RadixResult {
  ok: boolean
  /** decimal value of the input, when parseable */
  decimal?: number
  /** value in each supported base (2..36), when ok */
  values?: Record<number, string>
  reason?: "dec" | "hex-prefix" | "bin-prefix" | "oct-prefix" | "letter"
  message?: string
}

const digitValue = (char: string): number => {
  const code = char.charCodeAt(0)
  if (code >= 48 && code <= 57) return code - 48
  if (code >= 97 && code <= 122) return code - 87
  if (code >= 65 && code <= 90) return code - 55
  return 999
}

const PREFIXES: Array<{ prefix: string; base: number; reason: RadixResult["reason"] }> = [
  { prefix: "0x", base: 16, reason: "hex-prefix" },
  { prefix: "0b", base: 2, reason: "bin-prefix" },
  { prefix: "0o", base: 8, reason: "oct-prefix" },
]

/**
 * Parse an integer written in any base (2..36) and render it in every
 * base as an unsigned lowercase string. Never throws.
 */
export function convertRadix(input: string): RadixResult {
  const s = input.trim()
  if (s === "") return { ok: false, message: "Enter an integer." }
  const body = s.slice(2)
  if (!/^[0-9a-zA-Z]+$/.test(s) || (body !== "" && !/^[0-9a-zA-Z]+$/.test(body))) {
    return { ok: false, message: "Only digits and letters a–z/A–Z are allowed." }
  }
  let base: number | undefined
  let reason: RadixResult["reason"]
  let digits = s
  for (const p of PREFIXES) {
    if (s.startsWith(p.prefix)) {
      if (s.length === p.prefix.length) {
        return { ok: false, message: `Enter digits or letters after the ${p.prefix} prefix.` }
      }
      base = p.base
      reason = p.reason
      digits = s.slice(p.prefix.length)
      break
    }
  }
  if (base === undefined) {
    if (/[a-zA-Z]/.test(s)) {
      let highestDigit = 1
      for (const char of s) {
        const value = digitValue(char)
        if (value > highestDigit) highestDigit = value
      }
      base = Math.max(2, highestDigit + 1)
      if (base > 36) {
        return { ok: false, message: "The input uses characters that no base (2–36) allows." }
      }
      reason = "letter"
    } else {
      base = 10
      reason = "dec"
    }
  }
  const decimal = parseInt(digits, base!)
  if (!Number.isSafeInteger(decimal)) {
    return {
      ok: false,
      message: "The number is too large for JavaScript (max safe integer 9,007,199,254,740,991).",
    }
  }
  const values: Record<number, string> = {}
  for (let current = 2; current <= 36; current += 1) {
    values[current] = decimal.toString(current)
  }
  return { ok: true, decimal, values, reason }
}

/** The bases rendered by the radix tool, in display order. */
export const RADIX_BASES: number[] = [
  2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24,
  25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36,
]