import { describe, expect, it } from "vitest"
import { qrReaderEngine } from "./engine"
import { generateQrMatrix } from "@/lib/qr"
import { matrixToRgba } from "@/lib/qr"

async function rasterize(text: string) {
  const matrix = generateQrMatrix({
    input: { type: "text", text },
    render: {
      size: 384,
      margin: 4,
      errorCorrectionLevel: "M",
      foreground: "#000000",
      background: "#ffffff",
    },
  })
  const { rgba, width, height } = matrixToRgba(
    matrix.modules,
    matrix.size,
    4,
    [0, 0, 0],
    [255, 255, 255]
  )
  return { rgba, width, height }
}

describe("qrReaderEngine", () => {
  it("decodes a QR from a Uint8ClampedArray end to end", async () => {
    const payload = "https://example.com/engine-test?q=1"
    const { rgba, width, height } = await rasterize(payload)
    const result = await qrReaderEngine.run({
      width,
      height,
      data: rgba,
      fileName: "fixture.png",
      fileSizeBytes: 1024,
      mime: "image/png",
    })
    expect(result.output.ok).toBe(true)
    expect(result.output.content?.text).toBe(payload)
    expect(result.output.content?.classification.type).toBe("url")
  })

  it("rejects pixel data that is not a Uint8ClampedArray", async () => {
    const { rgba, width, height } = await rasterize("hello")
    await expect(
      qrReaderEngine.run({
        width,
        height,
        data: Array.from(rgba) as unknown as Uint8ClampedArray,
        fileName: "f.png",
        fileSizeBytes: 10,
        mime: "image/png",
      })
    ).rejects.toMatchObject({ code: "VALIDATION" })
  })

  it("rejects pixel data whose length does not match the dimensions", async () => {
    const { rgba, width } = await rasterize("hello")
    await expect(
      qrReaderEngine.run({
        width,
        height: 10,
        data: rgba,
        fileName: "f.png",
        fileSizeBytes: 10,
        mime: "image/png",
      })
    ).rejects.toMatchObject({ code: "VALIDATION" })
  })

  it("returns a clean 'not found' result for a non-QR image", async () => {
    const { rgba, width, height } = await rasterize("not-a-QR")
    // Flatten to uniform white — no finder pattern can exist.
    rgba.fill(255)
    const result = await qrReaderEngine.run({
      width,
      height,
      data: rgba,
      fileName: "noise.png",
      fileSizeBytes: 10,
      mime: "image/png",
    })
    expect(result.output.ok).toBe(false)
    expect(result.output.content).toBeNull()
  })
})
