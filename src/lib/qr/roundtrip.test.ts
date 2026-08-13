import { describe, expect, it } from "vitest"
import { PNG } from "pngjs"
import { encodePng, hexToRgb, matrixToRgba } from "./png"
import { generateQrMatrix } from "./matrix"
import { decodeQrFromRgba } from "./decode"

describe("encodePng", () => {
  it("produces a valid PNG that pngjs can read back", () => {
    const { rgba, width, height } = matrixToRgba(
      [true, false, true, false, true, false, true, false, true],
      3,
      2,
      [0, 0, 0],
      [255, 255, 255]
    )
    const bytes = encodePng(rgba, width, height)
    const png = PNG.sync.read(Buffer.from(bytes))
    expect(png.width).toBe(6)
    expect(png.height).toBe(6)
  })

  it("includes the PNG signature and IHDR", () => {
    const bytes = encodePng(new Uint8Array(2 * 2 * 4), 2, 2)
    const signature = Array.from(bytes.slice(0, 8))
    expect(signature).toEqual([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
  })

  it("rejects a mismatched pixel buffer", () => {
    expect(() => encodePng(new Uint8Array(10), 2, 2)).toThrow(/size mismatch/)
  })
})

describe("hexToRgb", () => {
  it("parses #rgb and #rrggbb", () => {
    expect(hexToRgb("#000")).toEqual([0, 0, 0])
    expect(hexToRgb("#ffffff")).toEqual([255, 255, 255])
    expect(hexToRgb("#a1b2c3")).toEqual([0xa1, 0xb2, 0xc3])
  })

  it("rejects invalid colors", () => {
    expect(() => hexToRgb("red")).toThrow(/Invalid color/)
    expect(() => hexToRgb("#12")).toThrow(/Invalid color/)
  })
})

describe("matrix ↔ decode round trip", () => {
  it("generates a QR, renders it to PNG, decodes it back to the original payload", () => {
    const payload = "https://example.com/roundtrip?x=1&y=%C3%A9"
    const matrix = generateQrMatrix({
      input: { type: "url", url: payload },
      render: {
        size: 384,
        margin: 4,
        errorCorrectionLevel: "M",
        foreground: "#000000",
        background: "#ffffff",
      },
    })
    const scale = 4
    const { rgba, width, height } = matrixToRgba(
      matrix.modules,
      matrix.size,
      scale,
      [0, 0, 0],
      [255, 255, 255]
    )
    const png = encodePng(rgba, width, height)
    const parsed = PNG.sync.read(Buffer.from(png))
    const decoded = decodeQrFromRgba({
      data: new Uint8Array(parsed.data.buffer, parsed.data.byteOffset, parsed.data.byteLength),
      width: parsed.width,
      height: parsed.height,
    })
    expect(decoded.ok).toBe(true)
    expect(decoded.content?.text).toBe(payload)
  })

  it("fails gracefully on a non-QR image", () => {
    const wide = 40
    const tall = 40
    const data = new Uint8Array(wide * tall * 4)
    const decoded = decodeQrFromRgba({ data, width: wide, height: tall })
    expect(decoded.ok).toBe(false)
    expect(decoded.content).toBeNull()
  })

  it("fails gracefully on undersized images", () => {
    const decoded = decodeQrFromRgba({ data: new Uint8Array(10 * 10 * 4), width: 10, height: 10 })
    expect(decoded.ok).toBe(false)
  })
})

describe("decodeQrFromRgba", () => {
  it("classifies a decoded URL payload safely", () => {
    const matrix = generateQrMatrix({
      input: { type: "text", text: "https://example.com" },
      render: {
        size: 256,
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
    const decoded = decodeQrFromRgba({ data: rgba, width, height })
    expect(decoded.ok).toBe(true)
    expect(decoded.content?.classification.type).toBe("url")
    expect(decoded.content?.actionUri).toBe("https://example.com")
  })

  it("never exposes an action for javascript: payloads", () => {
    const matrix = generateQrMatrix({
      input: { type: "text", text: "javascript:alert(1)" },
      render: {
        size: 256,
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
    const decoded = decodeQrFromRgba({ data: rgba, width, height })
    expect(decoded.ok).toBe(true)
    expect(decoded.content?.classification.type).toBe("plain")
    expect(decoded.content?.actionUri).toBeNull()
  })
})
