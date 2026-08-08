import { describe, expect, it } from "vitest"
import { pngBytes, jpegBytes, webpBytes } from "@/lib/image/testing/fixtures"
import { imageConverterEngine } from "./engine"

describe("imageConverterEngine", () => {
  it("converts JPEG → WebP at the requested quality", async () => {
    const source = jpegBytes(1200, 800)
    const result = await imageConverterEngine.run({
      bytes: source,
      bytesLength: source.length,
      to: "webp",
      quality: 80,
      outputBytes: 10_000,
      outputWidth: 1200,
      outputHeight: 800,
    })
    expect(result.output).toMatchObject({
      from: "jpeg",
      to: "webp",
      sourceWidth: 1200,
      sourceHeight: 800,
      quality: 80,
      qualityApplicable: true,
      outputBytes: 10_000,
    })
  })

  it("converts PNG → JPEG and reports quality", async () => {
    const source = pngBytes(640, 480)
    const result = await imageConverterEngine.run({
      bytes: source,
      bytesLength: source.length,
      to: "jpeg",
      quality: 65,
      outputBytes: 2000,
      outputWidth: 640,
      outputHeight: 480,
    })
    expect(result.output).toMatchObject({ from: "png", to: "jpeg", quality: 65 })
  })

  it("marks PNG targets as lossless", async () => {
    const result = await imageConverterEngine.run({
      bytes: webpBytes(200, 100),
      bytesLength: 300,
      to: "png",
      quality: 20,
      outputBytes: 800,
      outputWidth: 200,
      outputHeight: 100,
    })
    expect(result.output.qualityApplicable).toBe(false)
    expect(result.output.quality).toBe(100)
  })
})
