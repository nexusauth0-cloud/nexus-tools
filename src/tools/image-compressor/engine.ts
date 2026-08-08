import { z } from "zod"
import { createToolEngine, summarize } from "@/lib/tool-engine"
import { OUTPUT_FORMATS, formatFileSize } from "@/lib/image"
import { probeImageSource } from "@/lib/image/engine-source"

/**
 * Image Compressor engine.
 *
 * Compression quality is applied when the browser re-encodes the pixels;
 * this engine records facts about the re-encode. The byte count shown is
 * the real measured size of the produced blob — PNG output is lossless, so
 * the UI clearly states the quality slider has no effect there.
 */

export const COMPRESS_FORMATS = OUTPUT_FORMATS
export type CompressFormat = (typeof COMPRESS_FORMATS)[number]

const schema = z.object({
  bytes: z.instanceof(Uint8Array),
  bytesLength: z.number().int().nonnegative(),
  format: z.enum(COMPRESS_FORMATS),
  quality: z
    .number()
    .int()
    .min(1, "Quality must be 1–100.")
    .max(100, "Quality must be 1–100.")
    .default(85),
  outputBytes: z.number().int().nonnegative(),
  outputWidth: z.number().int().positive(),
  outputHeight: z.number().int().positive(),
})

export interface CompressOutput {
  sourceFormat: "jpeg" | "png" | "webp"
  sourceWidth: number
  sourceHeight: number
  sourceBytes: number
  format: CompressFormat
  quality: number
  /** PNG is lossless — the quality input is presented but has no effect. */
  qualityApplicable: boolean
  outputBytes: number
  outputWidth: number
  outputHeight: number
  /** Signed byte delta: positive when the output is smaller. */
  bytesReduced: number
  /** True when the output ends up larger than the input. */
  grew: boolean
}

export const imageCompressorEngine = createToolEngine<typeof schema, CompressOutput>({
  toolId: "image-compressor",
  schema,
  process: ({ bytes, bytesLength, format, quality, outputBytes, outputWidth, outputHeight }) => {
    const source = probeImageSource(bytes)
    const qualityApplicable = format !== "png"
    const appliedQuality = qualityApplicable ? quality : 100

    return {
      sourceFormat: source.format,
      sourceWidth: source.width,
      sourceHeight: source.height,
      sourceBytes: bytesLength,
      format,
      quality: appliedQuality,
      qualityApplicable,
      outputBytes,
      outputWidth,
      outputHeight,
      bytesReduced: Math.max(0, bytesLength - outputBytes),
      grew: outputBytes > bytesLength,
    }
  },
  summarize: {
    input: (value) => summarize(`${value.format.toUpperCase()} at ${value.quality}%`),
    output: (value) =>
      summarize(
        `${value.format.toUpperCase()} ${value.outputWidth}×${value.outputHeight}px · ${formatFileSize(value.outputBytes)}`
      ),
  },
})
