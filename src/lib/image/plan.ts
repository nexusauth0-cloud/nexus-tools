import { clampInt } from "./types"

/**
 * Pure geometry-plan for the image tools.
 *
 * Everything here is deterministic math with no browser dependencies, so
 * the engine layer stays unit-testable under Node.
 */

export interface ResizeRequest {
  sourceWidth: number
  sourceHeight: number
  /** Requested target width (px). */
  width: number
  /** Requested target height (px); ignored when lockAspect is true. */
  height: number
  /** Derive height from width keeping the source aspect ratio. */
  lockAspect: boolean
  /** Never produce output larger than the source (no upscaling). */
  noUpscale: boolean
}

export interface ResizePlan {
  targetWidth: number
  targetHeight: number
  sourceWidth: number
  sourceHeight: number
  /** True when no-upscale capped an otherwise larger request. */
  capped: boolean
  /** True when the final size exceeds the source (upscaling was allowed). */
  upscaled: boolean
  aspectRatio: number
}

/**
 * Resolves requested dimensions into the actual output size, honoring
 * aspect locking, integer pixel clamping and the no-upscale guarantee.
 */
export function computeResizePlan(request: ResizeRequest): ResizePlan {
  const sourceWidth = Math.max(1, Math.round(request.sourceWidth))
  const sourceHeight = Math.max(1, Math.round(request.sourceHeight))
  const aspect = sourceWidth / sourceHeight

  let targetWidth: number
  let targetHeight: number

  if (request.lockAspect) {
    targetWidth = clampInt(request.width, 1, 60_000)
    targetHeight = clampInt(targetWidth / aspect, 1, 60_000)
  } else {
    targetWidth = clampInt(request.width, 1, 60_000)
    targetHeight = clampInt(request.height, 1, 60_000)
  }

  const requestedLarger = targetWidth > sourceWidth || targetHeight > sourceHeight
  let capped = false

  if (request.noUpscale && requestedLarger) {
    capped = true
    targetWidth = Math.min(targetWidth, sourceWidth)
    targetHeight = Math.min(
      targetHeight,
      request.lockAspect ? Math.round(targetWidth / aspect) : targetHeight
    )
    if (!request.lockAspect && targetHeight > sourceHeight) {
      targetHeight = sourceHeight
    }
  }

  return {
    targetWidth,
    targetHeight,
    sourceWidth,
    sourceHeight,
    capped,
    upscaled: !request.noUpscale && requestedLarger,
    aspectRatio: targetWidth / targetHeight,
  }
}

export interface CropBounds {
  x: number
  y: number
  width: number
  height: number
}

export interface CropRequest {
  sourceWidth: number
  sourceHeight: number
  /** Selection anchor in source pixels; clamped onto the source. */
  x: number
  y: number
  width: number
  height: number
  /** Optional ratio constraint, e.g. { w: 16, h: 9 }. */
  ratio: { w: number; h: number } | null
  /** Canvas rotation in quarter turns (0–3). */
  rotation: number
}

export interface CropResult {
  selection: CropBounds
  rotation: 0 | 1 | 2 | 3
  /** Output canvas size after applying rotation and flips. */
  rotatedWidth: number
  rotatedHeight: number
}

/**
 * Clamps a crop selection onto the source. When a ratio is requested, the
 * selection is widened (never shrunk below 1px) to the largest ratio-correct
 * rect that fits the source, anchored at the clamped top-left corner.
 */
export function computeCropPlan(request: CropRequest): CropResult {
  const sourceWidth = request.sourceWidth
  const sourceHeight = request.sourceHeight

  if (request.ratio) {
    const x = clampInt(request.x, 0, Math.max(0, sourceWidth - 1))
    const y = clampInt(request.y, 0, Math.max(0, sourceHeight - 1))
    const availW = Math.max(1, sourceWidth - x)
    const availH = Math.max(1, sourceHeight - y)
    const scale = Math.min(availW / request.ratio.w, availH / request.ratio.h)
    const width = Math.max(1, Math.floor(request.ratio.w * scale))
    const height = Math.max(1, Math.floor(request.ratio.h * scale))
    return {
      selection: { x, y, width, height },
      rotation: normalizeRotation(request.rotation),
      rotatedWidth: width,
      rotatedHeight: height,
    }
  }

  const x = clampInt(request.x, 0, sourceWidth)
  const y = clampInt(request.y, 0, sourceHeight)
  const width = clampInt(request.width, 1, Math.max(1, sourceWidth - x))
  const height = clampInt(request.height, 1, Math.max(1, sourceHeight - y))
  const rotation = normalizeRotation(request.rotation)
  const swapped = rotation % 2 === 1

  return {
    selection: { x, y, width, height },
    rotation,
    rotatedWidth: swapped ? height : width,
    rotatedHeight: swapped ? width : height,
  }
}

function normalizeRotation(rotation: number): 0 | 1 | 2 | 3 {
  return (((rotation % 4) + 4) % 4) as 0 | 1 | 2 | 3
}

export interface RotateFlipPlan {
  rotation: 0 | 1 | 2 | 3
  flipH: boolean
  flipV: boolean
  width: number
  height: number
}

/** Output layout for a rotate/flip transform of the source. */
export function computeRotatePlan(
  sourceWidth: number,
  sourceHeight: number,
  rotation: number,
  flipH: boolean,
  flipV: boolean
): RotateFlipPlan {
  const rot = normalizeRotation(rotation)
  const swapped = rot % 2 === 1
  return {
    rotation: rot,
    flipH,
    flipV,
    width: swapped ? sourceHeight : sourceWidth,
    height: swapped ? sourceWidth : sourceHeight,
  }
}
