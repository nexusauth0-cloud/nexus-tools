import { z } from "zod"
import { createToolEngine, summarize } from "@/lib/tool-engine"
import { OUTPUT_FORMATS, IMAGE_FORMAT_INFO } from "@/lib/image"
import { probeImageSource } from "@/lib/image/engine-source"

/**
 * Image Converter — JPEG ⇄ PNG ⇄ WebP with quality control.
 *
 * Conversion always re-encodes the whole image; nothing is claimed about
 * other metadata (EXIF is not preserved in this tool, and that's stated
 * in the UI rather than implied).
 */

export const CONVERT_FORMATS = OUTPUT_FORMATS
export type ConvertFormat = (typeof CONVERT_FORMATS)[number]

const schema = z.object({
  bytes: z.instanceof(Uint8Array),
  bytesLength: z.number().int().nonnegative(),
  to: z.enum(CONVERT_FORMATS),
  quality: z
    .number()
    .int()
    .min(1, "Quality must be 1–100.")
    .max(100, "Quality must be 1–100.")
    .default(92),
  outputBytes: z.number().int().nonnegative(),
  outputWidth: z.number().int().positive(),
  outputHeight: z.number().int().positive(),
})

export interface ConvertOutput {
  from: "jpeg" | "png" | "webp"
  to: ConvertFormat
  sourceWidth: number
  sourceHeight: number
  sourceBytes: number
  quality: number
  qualityApplicable: boolean
  outputBytes: number
  outputWidth: number
  outputHeight: number
}

export const imageConverterEngine = createToolEngine<typeof schema, ConvertOutput>({
  toolId: "image-converter",
  schema,
  process: ({ bytes, bytesLength, to, quality, outputBytes, outputWidth, outputHeight }) => {
    const source = probeImageSource(bytes)
    const qualityApplicable = to !== "png"

    return {
      from: source.format,
      to,
      sourceWidth: source.width,
      sourceHeight: source.height,
      sourceBytes: bytesLength,
      quality: qualityApplicable ? quality : 100,
      qualityApplicable,
      outputBytes,
      outputWidth,
      outputHeight,
    }
  },
  summarize: {
    input: (value) => summarize(`Convert to ${value.to.toUpperCase()}`),
    output: (value) =>
      summarize(
        `${value.from.toUpperCase()} → ${value.to.toUpperCase()} · ${value.outputBytes} bytes`
      ),
  },
})

/** Declared capability copy for the manifest. */
export function formatLabel(format: ConvertFormat): string {
  return IMAGE_FORMAT_INFO[format].label
}
