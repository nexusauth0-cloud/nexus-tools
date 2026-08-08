import { z } from "zod"
import { createToolEngine, summarize, ToolExecutionError } from "@/lib/tool-engine"
import { computeCropPlan, OUTPUT_FORMATS } from "@/lib/image"
import { probeImageSource } from "@/lib/image/engine-source"

/**
 * Image Cropper.
 *
 * The interactive selection lives in the browser; this engine clamps it
 * onto the source, resolves ratio presets and computes the exact output
 * geometry (rotation included), then records the measured result facts.
 */

export const CROP_FORMATS = OUTPUT_FORMATS
export type CropFormat = (typeof CROP_FORMATS)[number]

export const CROP_RATIOS = ["free", "1:1", "4:3", "16:9"] as const
export type CropRatio = (typeof CROP_RATIOS)[number]

export interface CropSelection {
  x: number
  y: number
  width: number
  height: number
}

const schema = z.object({
  bytes: z.instanceof(Uint8Array),
  bytesLength: z.number().int().nonnegative(),
  /** Selection corner in source pixels (clamped by the plan). */
  x: z.number().int(),
  y: z.number().int(),
  width: z.number().int().nonnegative(),
  height: z.number().int().nonnegative(),
  ratio: z.enum(CROP_RATIOS).default("free"),
  /** Quarter turns: 0–3. */
  rotation: z.number().int().min(0).max(3).default(0),
  flipH: z.boolean().default(false),
  flipV: z.boolean().default(false),
  format: z.enum(CROP_FORMATS),
  quality: z.number().int().min(1).max(100).default(92),
  outputBytes: z.number().int().nonnegative(),
  outputWidth: z.number().int().positive(),
  outputHeight: z.number().int().positive(),
})

export interface CropOutput {
  sourceFormat: "jpeg" | "png" | "webp"
  sourceWidth: number
  sourceHeight: number
  selection: CropSelection
  ratio: CropRatio
  rotation: 0 | 1 | 2 | 3
  flipH: boolean
  flipV: boolean
  format: CropFormat
  quality: number
  qualityApplicable: boolean
  outputBytes: number
  outputWidth: number
  outputHeight: number
}

function ratioValue(ratio: CropRatio): { w: number; h: number } | null {
  if (ratio === "free") return null
  const [w, h] = ratio.split(":").map(Number)
  return { w, h }
}

export const imageCropperEngine = createToolEngine<typeof schema, CropOutput>({
  toolId: "image-cropper",
  schema,
  process: (input) => {
    const source = probeImageSource(input.bytes)

    const plan = computeCropPlan({
      sourceWidth: source.width,
      sourceHeight: source.height,
      x: input.x,
      y: input.y,
      width: input.width,
      height: input.height,
      ratio: ratioValue(input.ratio),
      rotation: input.rotation,
    })

    if (input.outputWidth !== plan.rotatedWidth || input.outputHeight !== plan.rotatedHeight) {
      throw new ToolExecutionError(
        "PROCESSING",
        "The output dimensions don't match the crop geometry."
      )
    }

    return {
      sourceFormat: source.format,
      sourceWidth: source.width,
      sourceHeight: source.height,
      selection: plan.selection,
      ratio: input.ratio,
      rotation: plan.rotation,
      flipH: input.flipH,
      flipV: input.flipV,
      format: input.format,
      quality: input.format === "png" ? 100 : input.quality,
      qualityApplicable: input.format !== "png",
      outputBytes: input.outputBytes,
      outputWidth: plan.rotatedWidth,
      outputHeight: plan.rotatedHeight,
    }
  },
  summarize: {
    input: (value) => summarize(`${value.ratio} crop ${value.width}×${value.height}px`),
    output: (value) =>
      summarize(`${value.outputWidth}×${value.outputHeight}px ${value.format.toUpperCase()}`),
  },
})
