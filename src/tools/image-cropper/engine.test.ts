import { describe, expect, it } from "vitest"
import { pngBytes, jpegBytes } from "@/lib/image/testing/fixtures"
import { imageCropperEngine } from "./engine"

const source = jpegBytes(1000, 800)

describe("imageCropperEngine", () => {
  it("clamps a free selection into the source bounds", async () => {
    const result = await imageCropperEngine.run({
      bytes: source,
      bytesLength: source.length,
      x: 950,
      y: 50,
      width: 200,
      height: 200,
      ratio: "free",
      rotation: 0,
      flipH: false,
      flipV: false,
      format: "jpeg",
      quality: 90,
      outputBytes: 1000,
      outputWidth: 50,
      outputHeight: 200,
    })
    expect(result.output.selection).toEqual({ x: 950, y: 50, width: 50, height: 200 })
    expect(result.output.outputWidth).toBe(50)
    expect(result.output.outputHeight).toBe(200)
  })

  it("resolves a 16:9 preset to the largest in-bounds rect", async () => {
    const result = await imageCropperEngine.run({
      bytes: source,
      bytesLength: source.length,
      x: 0,
      y: 0,
      width: 1000,
      height: 800,
      ratio: "16:9",
      rotation: 0,
      flipH: false,
      flipV: false,
      format: "webp",
      quality: 85,
      outputBytes: 500,
      outputWidth: 1000,
      outputHeight: 562,
    })
    const { selection } = result.output
    expect(selection.width / selection.height).toBeGreaterThanOrEqual(16 / 9 - 0.01)
    expect(selection.height).toBeLessThanOrEqual(800)
  })

  it("swaps output dimensions when rotated 90°", async () => {
    const result = await imageCropperEngine.run({
      bytes: source,
      bytesLength: source.length,
      x: 0,
      y: 0,
      width: 600,
      height: 400,
      ratio: "free",
      rotation: 1,
      flipH: false,
      flipV: false,
      format: "png",
      quality: 90,
      outputBytes: 200,
      outputWidth: 400,
      outputHeight: 600,
    })
    expect(result.output.rotation).toBe(1)
    expect(result.output.outputWidth).toBe(400)
    expect(result.output.outputHeight).toBe(600)
  })

  it("flags PNG as lossless output", async () => {
    const result = await imageCropperEngine.run({
      bytes: pngBytes(300, 200),
      bytesLength: 100,
      x: 0,
      y: 0,
      width: 300,
      height: 200,
      ratio: "free",
      rotation: 0,
      flipH: false,
      flipV: false,
      format: "png",
      quality: 55,
      outputBytes: 300,
      outputWidth: 300,
      outputHeight: 200,
    })
    expect(result.output.quality).toBe(100)
    expect(result.output.qualityApplicable).toBe(false)
  })

  it("rejects output dimensions that contradict the crop plan", async () => {
    await expect(
      imageCropperEngine.run({
        bytes: source,
        bytesLength: source.length,
        x: 0,
        y: 0,
        width: 600,
        height: 400,
        ratio: "free",
        rotation: 0,
        flipH: false,
        flipV: false,
        format: "jpeg",
        quality: 90,
        outputBytes: 100,
        outputWidth: 599,
        outputHeight: 400,
      })
    ).rejects.toMatchObject({ code: "PROCESSING" })
  })
})
