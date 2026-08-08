import { describe, expect, it } from "vitest"
import { pngBytes, jpegBytes, webpBytes } from "@/lib/image/testing/fixtures"
import { imageCompressorEngine } from "./engine"

describe("imageCompressorEngine", () => {
  it("records the re-encoded facts with real measured bytes", async () => {
    const source = jpegBytes(800, 600)
    const result = await imageCompressorEngine.run({
      bytes: source,
      bytesLength: source.length,
      format: "jpeg",
      quality: 70,
      outputBytes: 40,
      outputWidth: 800,
      outputHeight: 600,
    })
    expect(result.output).toMatchObject({
      sourceFormat: "jpeg",
      sourceWidth: 800,
      sourceHeight: 600,
      format: "jpeg",
      quality: 70,
      qualityApplicable: true,
      outputBytes: 40,
      grew: false,
    })
    expect(result.output.bytesReduced).toBeGreaterThan(0)
  })

  it("flags when the output grew (honest no-savings note)", async () => {
    const source = pngBytes(320, 240)
    const result = await imageCompressorEngine.run({
      bytes: source,
      bytesLength: source.length,
      format: "png",
      quality: 30,
      outputBytes: source.length * 2,
      outputWidth: 320,
      outputHeight: 240,
    })
    expect(result.output.grew).toBe(true)
  })

  it("marks PNG as lossless (quality not applicable)", async () => {
    const source = jpegBytes(100, 100)
    const result = await imageCompressorEngine.run({
      bytes: source,
      bytesLength: source.length,
      format: "png",
      quality: 10,
      outputBytes: 500,
      outputWidth: 100,
      outputHeight: 100,
    })
    expect(result.output.qualityApplicable).toBe(false)
    expect(result.output.quality).toBe(100)
  })

  it("keeps the original dimensions by default", async () => {
    const result = await imageCompressorEngine.run({
      bytes: webpBytes(400, 300),
      bytesLength: 1000,
      format: "webp",
      quality: 90,
      outputBytes: 900,
      outputWidth: 400,
      outputHeight: 300,
    })
    expect(result.output.outputWidth).toBe(400)
    expect(result.output.outputHeight).toBe(300)
  })
})
