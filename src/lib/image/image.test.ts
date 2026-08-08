import { describe, expect, it } from "vitest"
import {
  computeCropPlan,
  computeResizePlan,
  computeRotatePlan,
  detectImageFormat,
  formatFileSize,
  parseAspectRatio,
  readImageDimensions,
  validateImageBytes,
  fitToRatio,
} from "./index"

/** Builds a minimal valid PNG (width, height) with an empty IDAT. */
function pngBytes(width: number, height: number): Uint8Array {
  const bytes = new Uint8Array(65)
  bytes.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
  bytes.set([0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52], 8)
  bytes[16] = (width >>> 24) & 0xff
  bytes[17] = (width >>> 16) & 0xff
  bytes[18] = (width >>> 8) & 0xff
  bytes[19] = width & 0xff
  bytes[20] = (height >>> 24) & 0xff
  bytes[21] = (height >>> 16) & 0xff
  bytes[22] = (height >>> 8) & 0xff
  bytes[23] = height & 0xff
  bytes[24] = 8 // bit depth
  bytes[25] = 6 // color type: RGBA
  bytes.set([0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82], 53)
  return bytes
}

/** Builds a minimal JPEG: SOI, SOF0 with dimensions, EOI. */
function jpegBytes(width: number, height: number): Uint8Array {
  return Uint8Array.from([
    0xff,
    0xd8,
    0xff,
    0xe0,
    0x00,
    0x10,
    0x4a,
    0x46,
    0x49,
    0x46,
    0x00,
    0x01,
    0x01,
    0x00,
    0x00,
    0x01,
    0x00,
    0x01,
    0x00,
    0x00,
    0xff,
    0xc0,
    0x00,
    0x11,
    0x08,
    (height >>> 8) & 0xff,
    height & 0xff,
    (width >>> 8) & 0xff,
    width & 0xff,
    0x03,
    0x01,
    0x22,
    0x00,
    0x02,
    0x11,
    0x01,
    0x03,
    0x11,
    0x01,
    0xff,
    0xda,
    0x00,
    0x0c,
    0x03,
    0x01,
    0x00,
    0x02,
    0x11,
    0x03,
    0x11,
    0x00,
    0x3f,
    0x00,
    0xff,
    0xd9,
  ])
}

/** Minimal WebP (VP8X) with canvas (width, height). */
function webpBytes(width: number, height: number): Uint8Array {
  const bytes = new Uint8Array(30)
  bytes.set([0x52, 0x49, 0x46, 0x46, 0x24, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50], 0)
  bytes.set([0x56, 0x50, 0x38, 0x58, 0x0a, 0x00, 0x00, 0x00], 12)
  bytes[20] = 0x00 // flags: no alpha, no animation
  const w = width - 1
  const h = height - 1
  bytes[21] = w & 0xff
  bytes[22] = (w >>> 8) & 0xff
  bytes[23] = (w >>> 16) & 0xff
  bytes[24] = h & 0xff
  bytes[25] = (h >>> 8) & 0xff
  bytes[26] = (h >>> 16) & 0xff
  return bytes
}

function minimalAvif(): Uint8Array {
  const bytes = new Uint8Array(40)
  bytes.set([0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70], 0)
  bytes.set([0x61, 0x76, 0x69, 0x66, 0x00, 0x00, 0x00, 0x00, 0x61, 0x76, 0x69, 0x66], 8)
  return bytes
}

describe("detectImageFormat", () => {
  it("detects PNG by signature", () => {
    expect(detectImageFormat(pngBytes(4, 4))).toBe("png")
  })
  it("detects JPEG by magic bytes", () => {
    expect(detectImageFormat(jpegBytes(8, 8))).toBe("jpeg")
  })
  it("detects WebP by RIFF/WEBP header", () => {
    expect(detectImageFormat(webpBytes(100, 50))).toBe("webp")
  })
  it("detects AVIF by ftyp brand", () => {
    expect(detectImageFormat(minimalAvif())).toBe("avif")
  })
  it("rejects empty/unknown payloads", () => {
    expect(detectImageFormat(new Uint8Array(0))).toBeNull()
    expect(detectImageFormat(new TextEncoder().encode("hello world"))).toBeNull()
  })
})

describe("readImageDimensions", () => {
  it("reads PNG IHDR dimensions", () => {
    expect(readImageDimensions(pngBytes(640, 480))).toEqual({
      format: "png",
      width: 640,
      height: 480,
    })
  })
  it("supports 16-bit PNG width", () => {
    expect(readImageDimensions(pngBytes(1200, 300))?.width).toBe(1200)
  })
  it("reads JPEG SOF dimensions", () => {
    const dims = readImageDimensions(jpegBytes(1920, 1080))
    expect(dims).toEqual({ format: "jpeg", width: 1920, height: 1080 })
  })
  it("reads WebP VP8X canvas dimensions", () => {
    expect(readImageDimensions(webpBytes(400, 250))).toEqual({
      format: "webp",
      width: 400,
      height: 250,
    })
  })
  it("returns null for truncated PNG header", () => {
    expect(readImageDimensions(pngBytes(4, 4).subarray(0, 15))).toBeNull()
  })
  it("returns null when headers are zero-sized", () => {
    expect(readImageDimensions(pngBytes(0, 0))).toBeNull()
  })
})

describe("validateImageBytes", () => {
  it("accepts valid images of known formats", () => {
    expect(validateImageBytes(pngBytes(2, 2))).toEqual({ ok: true, format: "png" })
    expect(validateImageBytes(jpegBytes(2, 2))).toEqual({ ok: true, format: "jpeg" })
    expect(validateImageBytes(webpBytes(2, 2))).toEqual({ ok: true, format: "webp" })
  })
  it("rejects AVIF input with an honest unsupported message", () => {
    const result = validateImageBytes(minimalAvif())
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toBe("unsupported-format")
  })
  it("rejects non-image bytes", () => {
    const result = validateImageBytes(new TextEncoder().encode("not an image"))
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toBe("invalid-file")
  })
  it("accepts header-valid JPEGs even when the payload is truncated", () => {
    // Header screening is permissive on purpose: the real decode step
    // (browser) is the authority and reports failures there.
    const result = validateImageBytes(Uint8Array.from([0xff, 0xd8, 0xff, 0x01, 0x02, 0x03, 0x04]))
    expect(result.ok).toBe(true)
  })
  it("rejects oversized input with maxBytes", () => {
    const result = validateImageBytes(new Uint8Array(20 * 1024 * 1024 + 1))
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toBe("too-large")
  })
})

describe("computeResizePlan", () => {
  it("honors exact width+height when unlocked", () => {
    const plan = computeResizePlan({
      sourceWidth: 1000,
      sourceHeight: 500,
      width: 800,
      height: 400,
      lockAspect: false,
      noUpscale: true,
    })
    expect(plan.targetWidth).toBe(800)
    expect(plan.targetHeight).toBe(400)
    expect(plan.upscaled).toBe(false)
  })

  it("caps each dimension at the source when noUpscale", () => {
    const plan = computeResizePlan({
      sourceWidth: 1000,
      sourceHeight: 500,
      width: 800,
      height: 600,
      lockAspect: false,
      noUpscale: true,
    })
    expect(plan.targetWidth).toBe(800)
    expect(plan.targetHeight).toBe(500)
  })

  it("derives height from width when locked", () => {
    const plan = computeResizePlan({
      sourceWidth: 1000,
      sourceHeight: 500,
      width: 400,
      height: 999,
      lockAspect: true,
      noUpscale: true,
    })
    expect(plan.targetWidth).toBe(400)
    expect(plan.targetHeight).toBe(200)
  })

  it("never upscales when noUpscale is set", () => {
    const plan = computeResizePlan({
      sourceWidth: 100,
      sourceHeight: 200,
      width: 400,
      height: 400,
      lockAspect: false,
      noUpscale: true,
    })
    expect(plan.targetWidth).toBe(100)
    expect(plan.targetHeight).toBe(200)
    expect(plan.upscaled).toBe(false)
  })

  it("flags upscaling when allowed", () => {
    const plan = computeResizePlan({
      sourceWidth: 100,
      sourceHeight: 200,
      width: 400,
      height: 400,
      lockAspect: false,
      noUpscale: false,
    })
    expect(plan.targetWidth).toBe(400)
    expect(plan.upscaled).toBe(true)
  })

  it("clamps to integer pixels and sane maxima", () => {
    const plan = computeResizePlan({
      sourceWidth: 1000,
      sourceHeight: 500,
      width: 400.7,
      height: 300.2,
      lockAspect: false,
      noUpscale: true,
    })
    expect(Number.isInteger(plan.targetWidth)).toBe(true)
    expect(plan.targetWidth).toBe(401)
  })
})

describe("computeCropPlan", () => {
  const base = { sourceWidth: 1000, sourceHeight: 800, rotation: 0 }

  it("clamps selection inside source bounds", () => {
    const crop = computeCropPlan({ ...base, x: 950, y: 50, width: 200, height: 100, ratio: null })
    expect(crop.selection.x).toBe(950)
    expect(crop.selection.width).toBe(50)
    expect(crop.selection.height).toBe(100)
  })

  it("forces a minimum 1px selection", () => {
    const crop = computeCropPlan({ ...base, x: 0, y: 0, width: 0, height: 500, ratio: null })
    expect(crop.selection.width).toBe(1)
  })

  it("fits ratio presets to the largest in-bounds rect", () => {
    const crop = computeCropPlan({
      ...base,
      x: 0,
      y: 0,
      width: 1000,
      height: 800,
      ratio: { w: 16, h: 9 },
    })
    const actual = crop.selection.width / crop.selection.height
    // Integer flooring can shift the ratio by at most ~1px (~0.2%).
    expect(Math.abs(actual - 16 / 9)).toBeLessThan(0.005)
    expect(crop.selection.width).toBeLessThanOrEqual(1000)
    expect(crop.selection.height).toBeLessThanOrEqual(800)
  })

  it("swaps output dimensions when rotated 90°", () => {
    const crop = computeCropPlan({
      ...base,
      x: 100,
      y: 100,
      width: 400,
      height: 300,
      ratio: null,
      rotation: 1,
    })
    expect(crop.rotatedWidth).toBe(300)
    expect(crop.rotatedHeight).toBe(400)
    expect(crop.rotation).toBe(1)
  })

  it("normalizes negative rotations", () => {
    const crop = computeCropPlan({
      ...base,
      x: 0,
      y: 0,
      width: 10,
      height: 20,
      ratio: null,
      rotation: -1,
    })
    expect(crop.rotation).toBe(3)
  })
})

describe("computeRotatePlan", () => {
  it("swaps dims on quarter turns", () => {
    const plan = computeRotatePlan(800, 600, 1, false, false)
    expect(plan.width).toBe(600)
    expect(plan.height).toBe(800)
  })
  it("keeps dims on half/full turns", () => {
    expect(computeRotatePlan(800, 600, 2, false, false)).toMatchObject({ width: 800, height: 600 })
    expect(computeRotatePlan(800, 600, 0, false, false)).toMatchObject({ width: 800, height: 600 })
  })
})

describe("formatFileSize", () => {
  it("formats bytes, KB and MB", () => {
    expect(formatFileSize(512)).toBe("512 B")
    expect(formatFileSize(1024 * 842)).toMatch(/KB$/)
    expect(formatFileSize(1024 * 1024 * 1.4)).toMatch(/MB$/)
  })
  it("never fabricates for invalid values", () => {
    expect(formatFileSize(Number.NaN)).toBe("—")
  })
})

describe("parseAspectRatio & fitToRatio", () => {
  it("parses valid ratios", () => {
    expect(parseAspectRatio("16:9")).toEqual({ w: 16, h: 9 })
    expect(parseAspectRatio("1:1")).toEqual({ w: 1, h: 1 })
    expect(parseAspectRatio("nope")).toBeNull()
    expect(parseAspectRatio("0:5")).toBeNull()
  })

  it("fits a ratio within bounds", () => {
    const fit = fitToRatio(1000, 700, 16, 9)
    const actual = fit.width / fit.height
    expect(Math.abs(actual - 16 / 9)).toBeLessThan(0.005)
    expect(fit.width).toBeLessThanOrEqual(1000)
    expect(fit.height).toBeLessThanOrEqual(700)
  })
})
