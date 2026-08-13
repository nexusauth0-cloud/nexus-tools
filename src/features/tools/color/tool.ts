import { registerDecoration } from "@/lib/registry/artwork"

/**
 * Color converter: hex ↔ rgb ↔ hsl.
 *
 * Modes (param `mode`, default "auto"):
 *   auto   detect the input format (#hex, rgb(), hsl(), named?)
 *   to-hex force hex output
 *   to-rgb force rgb() output
 *   to-hsl force hsl() output
 */

export interface ColorToolResult {
  ok: boolean
  output: string
  blocks?: Array<{ label?: string; text: string; code?: boolean }>
  info?: Record<string, string>
}

interface Rgb {
  r: number
  g: number
  b: number
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

function rgbToHex({ r, g, b }: Rgb): string {
  const to2 = (value: number) => clamp(Math.round(value), 0, 255).toString(16).padStart(2, "0")
  return `#${to2(r)}${to2(g)}${to2(b)}`.toUpperCase()
}

function hexToRgb(hex: string): Rgb | undefined {
  const clean = hex.trim().replace(/^#/, "")
  if (clean.length !== 3 && clean.length !== 6) return undefined
  if (!/^[0-9a-fA-F]+$/.test(clean)) return undefined
  const expanded = clean.length === 3 ? [...clean].map((char) => char + char).join("") : clean
  const value = parseInt(expanded, 16)
  return { r: (value >> 16) & 0xff, g: (value >> 8) & 0xff, b: value & 0xff }
}

function rgbToHsl({ r, g, b }: Rgb): { h: number; s: number; l: number } {
  const rn = r / 255
  const gn = g / 255
  const bn = b / 255
  const max = Math.max(rn, gn, bn)
  const min = Math.min(rn, gn, bn)
  const delta = max - min
  let h = 0
  if (delta !== 0) {
    if (max === rn) h = 60 * (((gn - bn) / delta) % 6)
    else if (max === gn) h = 60 * ((bn - rn) / delta + 2)
    else h = 60 * ((rn - gn) / delta + 4)
  }
  const l = (max + min) / 2
  const s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1))
  return { h: (h + 360) % 360, s: s * 100, l: l * 100 }
}

function parseRgbFunction(input: string): Rgb | undefined {
  const match = input.trim().match(/^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/)
  if (!match) return undefined
  const [r, g, b] = [Number(match[1]), Number(match[2]), Number(match[3])]
  if ([r, g, b].some((value) => value > 255)) return undefined
  return { r, g, b }
}

function parseHslFunction(input: string): Rgb | undefined {
  const match = input
    .trim()
    .match(
      /^hsl\(\s*(\d{1,3})(?:\.\d+)?\s*,\s*(\d{1,3}(?:\.\d+)?)%\s*,\s*(\d{1,3}(?:\.\d+)?)%\s*\)$/
    )
  if (!match) return undefined
  const h = Number(match[1]) / 360
  const s = Number(match[2]) / 100
  const l = Number(match[3]) / 100
  const hueToRgb = (p: number, q: number, t: number) => {
    const tNorm = ((t % 1) + 1) % 1
    if (tNorm < 1 / 6) return p + (q - p) * 6 * tNorm
    if (tNorm < 1 / 2) return q
    if (tNorm < 2 / 3) return p + (q - p) * (2 / 3 - tNorm) * 6
    return p
  }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s
  const p = 2 * l - q
  return {
    r: Math.round(hueToRgb(p, q, h + 1 / 3) * 255),
    g: Math.round(hueToRgb(p, q, h) * 255),
    b: Math.round(hueToRgb(p, q, h - 1 / 3) * 255),
  }
}

function detect(input: string): Rgb | undefined {
  if (
    input.trim().startsWith("#") ||
    /^[0-9a-fA-F]{6}$/.test(input.trim()) ||
    /^[0-9a-fA-F]{3}$/.test(input.trim())
  ) {
    const rgb = hexToRgb(input)
    if (rgb) return rgb
  }
  return parseRgbFunction(input) ?? parseHslFunction(input)
}

const NAMED_COLORS: Record<string, Rgb> = {
  red: { r: 255, g: 0, b: 0 },
  green: { r: 0, g: 128, b: 0 },
  blue: { r: 0, g: 0, b: 255 },
  black: { r: 0, g: 0, b: 0 },
  white: { r: 255, g: 255, b: 255 },
  gray: { r: 128, g: 128, b: 128 },
  grey: { r: 128, g: 128, b: 128 },
  yellow: { r: 255, g: 255, b: 0 },
  cyan: { r: 0, g: 255, b: 255 },
  magenta: { r: 255, g: 0, b: 255 },
  orange: { r: 255, g: 165, b: 0 },
  purple: { r: 128, g: 0, b: 128 },
  pink: { r: 255, g: 192, b: 203 },
  brown: { r: 165, g: 42, b: 42 },
}

export function run(input: string, params: Record<string, string>): ColorToolResult {
  const text = input.trim()
  if (text === "") return { ok: false, output: "Enter a color to convert." }
  const named = NAMED_COLORS[text.toLowerCase()]
  const rgb = named ?? detect(text)
  if (!rgb) {
    return {
      ok: false,
      output:
        'Invalid color. Try "#ff8800", "rgb(255, 136, 0)", "hsl(32, 100%, 50%)", or "orange".',
    }
  }
  const hsl = rgbToHsl(rgb)
  const hex = rgbToHex(rgb)
  const formatRgb = (value: Rgb) => `rgb(${value.r}, ${value.g}, ${value.b})`
  const formatHsl = (value: { h: number; s: number; l: number }) =>
    `hsl(${Math.round(value.h)}, ${Math.round(value.s)}%, ${Math.round(value.l)}%)`

  const mode = (params["mode"] ?? "auto") as "auto" | "to-hex" | "to-rgb" | "to-hsl"
  const outputs: Array<{ label?: string; text: string; code?: boolean }> = [
    { label: "Hex", text: hex, code: true },
    { label: "RGB", text: formatRgb(rgb), code: true },
    { label: "HSL", text: formatHsl(hsl), code: true },
  ]

  const primary =
    mode === "to-hex"
      ? hex
      : mode === "to-rgb"
        ? formatRgb(rgb)
        : mode === "to-hsl"
          ? formatHsl(hsl)
          : hex

  const info: Record<string, string> = {}
  info["swatch"] = hex
  if (named) info["guessed as"] = `named color "${text.toLowerCase()}"`
  return {
    ok: true,
    output: primary,
    blocks: outputs,
    info,
  }
}

registerDecoration(
  "color",
  ["   ██████   #FF8800", "   ██████   rgb(255, 136, 0)", "   ██████   hsl(32, 100%, 50%)"].join(
    "\n"
  )
)

export const helpArt: string = [
  "╔══════════════════════════════════════╗",
  "║        Color converter (hex/rgb)     ║",
  "╚══════════════════════════════════════╝",
].join("\n")
