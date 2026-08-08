/**
 * Deterministic color conversion utilities (HEX / RGB / HSL / HSV / CMYK).
 *
 * All functions operate on normalized ranges and never clamp silently —
 * they return `null` (or throw) for out-of-range values so callers can
 * surface a validation error instead. Round-trip precision is preserved
 * within 8-bit RGB granularity.
 */

export interface RgbColor {
  r: number
  g: number
  b: number
}

export interface HslColor {
  h: number
  s: number
  l: number
}

export interface HsvColor {
  h: number
  s: number
  v: number
}

export interface CmykColor {
  c: number
  m: number
  y: number
  k: number
}

const HEX_SHORT = /^#?([0-9a-f]{3})$/i
const HEX_LONG = /^#?([0-9a-f]{6})$/i

/** Parse "#rgb", "#rrggbb" (with or without '#') into RGB. */
export function hexToRgb(value: string): RgbColor | null {
  const input = value.trim()
  const short = HEX_SHORT.exec(input)
  if (short) {
    const [r, g, b] = short[1].split("").map((char) => Number.parseInt(char + char, 16))
    return { r, g, b }
  }
  const long = HEX_LONG.exec(input)
  if (long) {
    return {
      r: Number.parseInt(long[1].slice(0, 2), 16),
      g: Number.parseInt(long[1].slice(2, 4), 16),
      b: Number.parseInt(long[1].slice(4, 6), 16),
    }
  }
  return null
}

/** RGB → 6-digit lowercase hex. */
export function rgbToHex({ r, g, b }: RgbColor): string {
  return `#${[r, g, b].map((channel) => channel.toString(16).padStart(2, "0")).join("")}`
}

/** Parse "rgb(r, g, b)" with 0–255 channels. */
export function rgbToHsl({ r, g, b }: RgbColor): HslColor {
  const rs = r / 255
  const gs = g / 255
  const bs = b / 255
  const max = Math.max(rs, gs, bs)
  const min = Math.min(rs, gs, bs)
  const delta = max - min

  let h = 0
  if (delta !== 0) {
    if (max === rs) h = ((gs - bs) / delta) % 6
    else if (max === gs) h = (bs - rs) / delta + 2
    else h = (rs - gs) / delta + 4
    h *= 60
    if (h < 0) h += 360
  }

  const l = (max + min) / 2
  const s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1))

  return { h: round3(h), s: round3(s * 100), l: round3(l * 100) }
}

/** Parse "hsl(h, s%, l%)" with 0–360 hue and 0–100 percentages. */
export function hslToRgb({ h, s, l }: HslColor): RgbColor | null {
  if (!isFinite01(s) || !isFinite01(l)) return null
  const hs = (((h % 360) + 360) % 360) / 360
  const ss = s / 100
  const ls = l / 100
  const c = (1 - Math.abs(2 * ls - 1)) * ss
  const x = c * (1 - Math.abs(((hs * 6) % 2) - 1))
  const m = ls - c / 2

  let rgb: [number, number, number]
  if (hs < 1 / 6) rgb = [c, x, 0]
  else if (hs < 2 / 6) rgb = [x, c, 0]
  else if (hs < 3 / 6) rgb = [0, c, x]
  else if (hs < 4 / 6) rgb = [0, x, c]
  else if (hs < 5 / 6) rgb = [x, 0, c]
  else rgb = [c, 0, x]

  return {
    r: Math.round((rgb[0] + m) * 255),
    g: Math.round((rgb[1] + m) * 255),
    b: Math.round((rgb[2] + m) * 255),
  }
}

/** RGB → HSV (0–360 hue, 0–100 %). */
export function rgbToHsv({ r, g, b }: RgbColor): HsvColor {
  const rs = r / 255
  const gs = g / 255
  const bs = b / 255
  const max = Math.max(rs, gs, bs)
  const min = Math.min(rs, gs, bs)
  const delta = max - min

  let h = 0
  if (delta !== 0) {
    if (max === rs) h = ((gs - bs) / delta) % 6
    else if (max === gs) h = (bs - rs) / delta + 2
    else h = (rs - gs) / delta + 4
    h *= 60
    if (h < 0) h += 360
  }

  return {
    h: round3(h),
    s: round3(max === 0 ? 0 : (delta / max) * 100),
    v: round3(max * 100),
  }
}

/** Parse "hsv(h, s%, v%)" with 0–360 hue and 0–100 percentages. */
export function hsvToRgb({ h, s, v }: HsvColor): RgbColor | null {
  if (!isFinite01(s) || !isFinite01(v)) return null
  const hs = (((h % 360) + 360) % 360) / 360
  const ss = s / 100
  const vs = v / 100
  const c = vs * ss
  const x = c * (1 - Math.abs(((hs * 6) % 2) - 1))
  const m = vs - c

  let rgb: [number, number, number]
  if (hs < 1 / 6) rgb = [c, x, 0]
  else if (hs < 2 / 6) rgb = [x, c, 0]
  else if (hs < 3 / 6) rgb = [0, c, x]
  else if (hs < 4 / 6) rgb = [0, x, c]
  else if (hs < 5 / 6) rgb = [x, 0, c]
  else rgb = [c, 0, x]

  return {
    r: Math.round((rgb[0] + m) * 255),
    g: Math.round((rgb[1] + m) * 255),
    b: Math.round((rgb[2] + m) * 255),
  }
}

/** RGB → CMYK percentages (0–100, key applied per channel). */
export function rgbToCmyk({ r, g, b }: RgbColor): CmykColor {
  const rs = r / 255
  const gs = g / 255
  const bs = b / 255
  const k = 1 - Math.max(rs, gs, bs)
  if (k >= 1) return { c: 0, m: 0, y: 0, k: 100 }
  return {
    c: round3(((1 - rs - k) / (1 - k)) * 100),
    m: round3(((1 - gs - k) / (1 - k)) * 100),
    y: round3(((1 - bs - k) / (1 - k)) * 100),
    k: round3(k * 100),
  }
}

/** Parse "cmyk(c%, m%, y%, k%)" with 0–100 percentages. */
export function cmykToRgb({ c, m, y, k }: CmykColor): RgbColor | null {
  if (!isFinite01(c) || !isFinite01(m) || !isFinite01(y) || !isFinite01(k)) return null
  const cs = c / 100
  const ms = m / 100
  const ys = y / 100
  const ks = k / 100
  return {
    r: Math.round(255 * (1 - cs) * (1 - ks)),
    g: Math.round(255 * (1 - ms) * (1 - ks)),
    b: Math.round(255 * (1 - ys) * (1 - ks)),
  }
}

const RGB_FUNCTION = /^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/i
const HSL_FUNCTION = /^hsl\(\s*([\d.]+)\s*,\s*([\d.]+)%\s*,\s*([\d.]+)%\s*\)$/i
const HSV_FUNCTION = /^hsv\(\s*([\d.]+)\s*,\s*([\d.]+)%\s*,\s*([\d.]+)%\s*\)$/i
const CMYK_FUNCTION = /^cmyk\(\s*([\d.]+)%\s*,\s*([\d.]+)%\s*,\s*([\d.]+)%\s*,\s*([\d.]+)%\s*\)$/i

export interface ParsedColor {
  /** The input string, normalized. */
  source: string
  rgb: RgbColor
}

/** Parse any supported textual color representation. Returns null when invalid. */
export function parseColor(value: string): ParsedColor | null {
  const input = value.trim()
  if (input === "") return null

  const hex = hexToRgb(input)
  if (hex) return { source: rgbToHex(hex), rgb: hex }

  const rgbMatch = RGB_FUNCTION.exec(input)
  if (rgbMatch) {
    const r = Number(rgbMatch[1])
    const g = Number(rgbMatch[2])
    const b = Number(rgbMatch[3])
    if (r > 255 || g > 255 || b > 255) return null
    const rgb = { r, g, b }
    return { source: rgbToHex(rgb), rgb }
  }

  const hslMatch = HSL_FUNCTION.exec(input)
  if (hslMatch) {
    const hsl: HslColor = {
      h: Number(hslMatch[1]),
      s: Number(hslMatch[2]),
      l: Number(hslMatch[3]),
    }
    const rgb = hslToRgb(hsl)
    return rgb ? { source: rgbToHex(rgb), rgb } : null
  }

  const hsvMatch = HSV_FUNCTION.exec(input)
  if (hsvMatch) {
    const hsv: HsvColor = {
      h: Number(hsvMatch[1]),
      s: Number(hsvMatch[2]),
      v: Number(hsvMatch[3]),
    }
    const rgb = hsvToRgb(hsv)
    return rgb ? { source: rgbToHex(rgb), rgb } : null
  }

  const cmykMatch = CMYK_FUNCTION.exec(input)
  if (cmykMatch) {
    const cmyk: CmykColor = {
      c: Number(cmykMatch[1]),
      m: Number(cmykMatch[2]),
      y: Number(cmykMatch[3]),
      k: Number(cmykMatch[4]),
    }
    const rgb = cmykToRgb(cmyk)
    return rgb ? { source: rgbToHex(rgb), rgb } : null
  }

  return null
}

function isFinite01(value: number): boolean {
  return Number.isFinite(value) && value >= 0 && value <= 100
}

function round3(value: number): number {
  return Math.round(value * 1000) / 1000
}
