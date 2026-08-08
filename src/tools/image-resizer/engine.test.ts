import { describe, expect, it } from "vitest"
import { pngBytes, jpegBytes } from "@/lib/image/testing/fixtures"
import { computeResizePlan } from "@/lib/image"
import { imageResizerEngine } from "./engine"

const PNG_600_400 = pngBytes(600, 400)

describe("imageResizerEngine", () => {
  it("plans an exact resize with aspect locked", async () => {
    const result = await imageResizerEngine.run({
      bytes: PNG_600_400,
      bytesLength: PNG_600_400.length,
      width: 300,
      height: 200,
      lockAspect: true,
      format: "jpeg",
      quality: 85,
      outputBytes: 12_345,
      outputWidth: 300,
      outputHeight: 200,
    })
    expect(result.output).toMatchObject({
      sourceFormat: "png",
      sourceWidth: 600,
      sourceHeight: 400,
      targetWidth: 300,
      targetHeight: 200,
      capped: false,
      format: "jpeg",
      quality: 85,
      qualityApplicable: true,
      outputBytes: 12_345,
    })
  })

  it("honours the aspect lock and ignores the height field", async () => {
    const result = await imageResizerEngine.run({
      bytes: PNG_600_400,
      bytesLength: PNG_600_400.length,
      width: 150,
      height: 999,
      lockAspect: true,
      format: "jpeg",
      quality: 90,
      outputBytes: 100,
      outputWidth: 150,
      outputHeight: 100,
    })
    expect(result.output.outputHeight).toBe(100)
  })

  it("caps output at the source size (no upscaling)", async () => {
    const result = await imageResizerEngine.run({
      bytes: PNG_600_400,
      bytesLength: PNG_600_400.length,
      width: 1200,
      height: 800,
      lockAspect: false,
      format: "jpeg",
      quality: 90,
      outputBytes: 500,
      outputWidth: 600,
      outputHeight: 400,
    })
    expect(result.output).toMatchObject({ targetWidth: 600, targetHeight: 400, capped: true })
  })

  it("flags PNG output as quality-not-applicable", async () => {
    const result = await imageResizerEngine.run({
      bytes: jpegBytes(640, 480),
      bytesLength: 1000,
      width: 320,
      height: 240,
      lockAspect: false,
      format: "png",
      quality: 50,
      outputBytes: 2000,
      outputWidth: 320,
      outputHeight: 240,
    })
    expect(result.output.qualityApplicable).toBe(false)
    expect(result.output.format).toBe("png")
  })

  it("rejects input that isn't a supported image", async () => {
    const garbage = new TextEncoder().encode("definitely not an image")
    await expect(
      imageResizerEngine.run({
        bytes: garbage,
        bytesLength: garbage.length,
        width: 100,
        height: 100,
        lockAspect: false,
        format: "jpeg",
        quality: 90,
        outputBytes: 0,
        outputWidth: 1,
        outputHeight: 1,
      })
    ).rejects.toThrow(/image/i)
  })

  it("rejects oversized sources with the FILE_TOO_LARGE contract", async () => {
    const big = new Uint8Array(21 * 1024 * 1024)
    big.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], 0)
    await expect(
      imageResizerEngine.run({
        bytes: big,
        bytesLength: big.length,
        width: 100,
        height: 100,
        lockAspect: false,
        format: "jpeg",
        quality: 90,
        outputBytes: 0,
        outputWidth: 1,
        outputHeight: 1,
      })
    ).rejects.toMatchObject({ code: "FILE_TOO_LARGE" })
  })

  it("rejects mismatched reported output dimensions", async () => {
    await expect(
      imageResizerEngine.run({
        bytes: PNG_600_400,
        bytesLength: PNG_600_400.length,
        width: 300,
        height: 200,
        lockAspect: false,
        format: "jpeg",
        quality: 90,
        outputBytes: 100,
        outputWidth: 299,
        outputHeight: 200,
      })
    ).rejects.toMatchObject({ code: "PROCESSING" })
  })

  it("uses the same maths as the shared plan module", () => {
    const plan = computeResizePlan({
      sourceWidth: 600,
      sourceHeight: 400,
      width: 300,
      height: 200,
      lockAspect: true,
      noUpscale: true,
    })
    expect(plan.targetWidth).toBe(300)
    expect(plan.targetHeight).toBe(200)
    expect(plan.upscaled).toBe(false)
  })
})
