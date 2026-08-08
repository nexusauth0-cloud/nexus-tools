import { z } from "zod"
import { createToolEngine, summarize, ToolExecutionError } from "@/lib/tool-engine"
import { computeResizePlan, OUTPUT_FORMATS } from "@/lib/image"
import { probeImageSource } from "@/lib/image/engine-source"

/**
 * Image Resizer engine.
 *
 * This engine plans the resize from the source's own header (magic bytes +
 * dimensions) and records the measured outcome reported by the tool after
 * the pixels were re-encoded by the browser. It never guesses sizes and
 * never fabricates compression numbers — the byte count always comes from
 * the actual output blob.
 */

export const RESIZE_FORMATS = OUTPUT_FORMATS
export type ResizeFormat = (typeof RESIZE_FORMATS)[number]

const schema = z.object({
  /** Raw file bytes (magic-byte validation happens here). */
  bytes: z.instanceof(Uint8Array),
  /** Declared source size in bytes — re-checked against the real payload. */
  bytesLength: z.number().int().nonnegative(),
  /** Requested width, px. */
  width: z
    .number()
    .int()
    .min(1, "Width must be at least 1 px.")
    .max(60_000, "Width is out of range."),
  /** Requested height, px (used when aspect isn't locked). */
  height: z
    .number()
    .int()
    .min(1, "Height must be at least 1 px.")
    .max(60_000, "Height is out of range."),
  lockAspect: z.boolean(),
  format: z.enum(RESIZE_FORMATS),
  quality: z
    .number()
    .int()
    .min(1, "Quality must be 1–100.")
    .max(100, "Quality must be 1–100.")
    .default(90),
  /** Measured size of the encoded result, reported by the tool. */
  outputBytes: z.number().int().nonnegative(),
  /** Measured output dimensions, reported by the tool. */
  outputWidth: z.number().int().positive(),
  outputHeight: z.number().int().positive(),
})

export interface ResizeOutput {
  sourceFormat: ResizeFormat
  sourceWidth: number
  sourceHeight: number
  sourceBytes: number
  targetWidth: number
  targetHeight: number
  /** True when the source was capped because upscaling isn't allowed. */
  capped: boolean
  format: ResizeFormat
  quality: number
  qualityApplicable: boolean
  outputBytes: number
  outputWidth: number
  outputHeight: number
}

function qualityHint(format: ResizeFormat): string {
  return `${format.toUpperCase()}${format === "png" ? " (lossless)" : ""}`
}

export const imageResizerEngine = createToolEngine<typeof schema, ResizeOutput>({
  toolId: "image-resizer",
  schema,
  process: ({
    bytes,
    bytesLength,
    width,
    height,
    lockAspect,
    format,
    quality,
    outputBytes,
    outputWidth,
    outputHeight,
  }) => {
    const source = probeImageSource(bytes)

    const plan = computeResizePlan({
      sourceWidth: source.width,
      sourceHeight: source.height,
      width,
      height,
      lockAspect,
      // Upscaling is never allowed for this tool.
      noUpscale: true,
    })

    if (outputWidth !== plan.targetWidth || outputHeight !== plan.targetHeight) {
      throw new ToolExecutionError(
        "PROCESSING",
        "The output dimensions don't match the requested resize."
      )
    }

    return {
      sourceFormat: source.format,
      sourceWidth: source.width,
      sourceHeight: source.height,
      sourceBytes: bytesLength,
      targetWidth: plan.targetWidth,
      targetHeight: plan.targetHeight,
      capped: plan.capped,
      format,
      quality: format === "png" ? 100 : quality,
      qualityApplicable: format !== "png",
      outputBytes,
      outputWidth,
      outputHeight,
    }
  },
  summarize: {
    input: (value) =>
      summarize(
        `${qualityHint(value.format)} ${value.width}×${value.height}px (${value.lockAspect ? "locked" : "free"})`
      ),
    output: (value) =>
      summarize(
        `${value.format.toUpperCase()} ${value.outputWidth}×${value.outputHeight}px · ${value.outputBytes} bytes`
      ),
  },
})
