import { z } from "zod"
import { createToolEngine, summarize, ToolExecutionError } from "@/lib/tool-engine"
import { parseColor, rgbToCmyk, rgbToHex, rgbToHsl, rgbToHsv, type RgbColor } from "@/lib/color"

/**
 * Color Converter engine — deterministic conversion between HEX, RGB,
 * HSL, HSV and CMYK. Parsing/validation lives in `@/lib/color` (pure and
 * unit-tested) so the live preview and this engine always agree.
 */

export interface ColorOutput {
  /** Normalized lowercase hex, e.g. "#ff6600". */
  hex: string
  rgb: string
  hsl: string
  hsv: string
  cmyk: string
  /** 0–255 components used for the live preview. */
  preview: RgbColor
}

const schema = z.object({
  color: z.string().trim().min(1, "Enter a color to convert.").max(120, "Color is too long."),
})

export const colorConverterEngine = createToolEngine<typeof schema, ColorOutput>({
  toolId: "color-converter",
  schema,
  process: ({ color }) => {
    const parsed = parseColor(color)
    if (!parsed) {
      throw new ToolExecutionError(
        "VALIDATION",
        "Enter a color as HEX (#rgb or #rrggbb), rgb(r, g, b), hsl(h, s%, l%), hsv(h, s%, v%) or cmyk(c%, m%, y%, k%)."
      )
    }

    const rgb = parsed.rgb
    const hsl = rgbToHsl(rgb)
    const hsv = rgbToHsv(rgb)
    const cmyk = rgbToCmyk(rgb)

    return {
      hex: rgbToHex(rgb),
      rgb: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`,
      hsl: `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`,
      hsv: `hsv(${hsv.h}, ${hsv.s}%, ${hsv.v}%)`,
      cmyk: `cmyk(${cmyk.c}%, ${cmyk.m}%, ${cmyk.y}%, ${cmyk.k}%)`,
      preview: rgb,
    }
  },
  summarize: {
    input: (value) => summarize(value.color),
    output: (value) => value.hex,
  },
})
