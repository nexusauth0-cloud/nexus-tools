import { describe, expect, it } from "vitest"
import {
  cmykToRgb,
  hexToRgb,
  hslToRgb,
  hsvToRgb,
  parseColor,
  rgbToCmyk,
  rgbToHex,
  rgbToHsl,
  rgbToHsv,
  type RgbColor,
} from "@/lib/color"
import { colorConverterEngine } from "./engine"

function approx(a: RgbColor, b: RgbColor): boolean {
  return Math.abs(a.r - b.r) <= 1 && Math.abs(a.g - b.g) <= 1 && Math.abs(a.b - b.b) <= 1
}

describe("color conversion primitives", () => {
  it("hex → rgb (3 and 6 digit)", () => {
    expect(hexToRgb("#f00")).toEqual({ r: 255, g: 0, b: 0 })
    expect(hexToRgb("#ff6600")).toEqual({ r: 255, g: 102, b: 0 })
    expect(hexToRgb("abc")).toEqual({ r: 170, g: 187, b: 204 })
    expect(hexToRgb("#12")).toBeNull()
  })

  it("rgb → hex", () => {
    expect(rgbToHex({ r: 255, g: 102, b: 0 })).toBe("#ff6600")
    expect(rgbToHex({ r: 0, g: 0, b: 0 })).toBe("#000000")
    expect(rgbToHex({ r: 255, g: 255, b: 255 })).toBe("#ffffff")
  })

  it("rgb → hsl → rgb round trip", () => {
    const source: RgbColor = { r: 220, g: 20, b: 60 }
    const hsl = rgbToHsl(source)
    const back = hslToRgb(hsl)
    expect(back).not.toBeNull()
    expect(approx(back as RgbColor, source)).toBe(true)
  })

  it("hsl accepts percentages and rejects out-of-range", () => {
    expect(hslToRgb({ h: 0, s: 100, l: 50 })).toEqual({ r: 255, g: 0, b: 0 })
    expect(hslToRgb({ h: 120, s: 100, l: 50 })).toEqual({ r: 0, g: 255, b: 0 })
    expect(hslToRgb({ h: 0, s: 150, l: 50 })).toBeNull()
    expect(hslToRgb({ h: 0, s: 100, l: 101 })).toBeNull()
  })

  it("rgb → hsv → rgb round trip", () => {
    const source: RgbColor = { r: 40, g: 200, b: 90 }
    const hsv = rgbToHsv(source)
    const back = hsvToRgb(hsv)
    expect(back).not.toBeNull()
    expect(approx(back as RgbColor, source)).toBe(true)
  })

  it("hsv accepts percentages and rejects out-of-range", () => {
    expect(hsvToRgb({ h: 210, s: 100, v: 100 })).toEqual({ r: 0, g: 128, b: 255 })
    expect(hsvToRgb({ h: 0, s: 100, v: 100 })).toEqual({ r: 255, g: 0, b: 0 })
    expect(hsvToRgb({ h: 0, s: -1, v: 100 })).toBeNull()
    expect(hsvToRgb({ h: 0, s: 100, v: 200 })).toBeNull()
  })

  it("rgb → cmyk → rgb round trip", () => {
    const source: RgbColor = { r: 255, g: 204, b: 0 }
    const cmyk = rgbToCmyk(source)
    const back = cmykToRgb(cmyk)
    expect(back).not.toBeNull()
    expect(approx(back as RgbColor, source)).toBe(true)
  })

  it("cmyk rejects out-of-range percentages", () => {
    expect(cmykToRgb({ c: 0, m: 0, y: 0, k: 0 })).toEqual({ r: 255, g: 255, b: 255 })
    expect(cmykToRgb({ c: 0, m: 0, y: 0, k: 100 })).toEqual({ r: 0, g: 0, b: 0 })
    expect(cmykToRgb({ c: 101, m: 0, y: 0, k: 0 })).toBeNull()
    expect(cmykToRgb({ c: 0, m: 0, y: 0, k: -1 })).toBeNull()
  })
})

describe("parseColor", () => {
  it("parses every supported format", () => {
    expect(parseColor("#00ff00")?.rgb).toEqual({ r: 0, g: 255, b: 0 })
    expect(parseColor("f00")?.rgb).toEqual({ r: 255, g: 0, b: 0 })
    expect(parseColor("rgb(10, 20, 30)")?.rgb).toEqual({ r: 10, g: 20, b: 30 })
    expect(parseColor("hsl(120, 50%, 50%)")?.rgb).toEqual({ r: 64, g: 191, b: 64 })
    expect(parseColor("hsv(120, 50%, 50%)")?.rgb).toEqual({ r: 64, g: 128, b: 64 })
    expect(parseColor("cmyk(0%, 20%, 100%, 0%)")?.rgb).toEqual({ r: 255, g: 204, b: 0 })
    expect(parseColor("orange")?.rgb).toEqual({ r: 255, g: 165, b: 0 })
    expect(parseColor("ORANGE")?.rgb).toEqual({ r: 255, g: 165, b: 0 })
    expect(parseColor("grey")?.rgb).toEqual(parseColor("gray")?.rgb)
  })

  it("rejects invalid input", () => {
    for (const bad of [
      "",
      "not a color",
      "rgb(300, 0, 0)",
      "rgb(0, 0)",
      "hsl(0, 100, 0)",
      "#12345",
    ]) {
      expect(parseColor(bad)).toBeNull()
    }
  })
})

describe("colorConverterEngine", () => {
  it("converts a full color and exposes every representation", async () => {
    const result = await colorConverterEngine.run({ color: "#ff6600" })
    expect(result.output.hex).toBe("#ff6600")
    expect(result.output.rgb).toBe("rgb(255, 102, 0)")
    expect(result.output.hsl).toBe("hsl(24, 100%, 50%)")
    expect(result.output.hsv).toBe("hsv(24, 100%, 100%)")
    expect(result.output.cmyk).toBe("cmyk(0%, 60%, 100%, 0%)")
    expect(result.output.preview).toEqual({ r: 255, g: 102, b: 0 })
  })

  it("accepts short hex and normalizes it", async () => {
    const result = await colorConverterEngine.run({ color: "#abc" })
    expect(result.output.hex).toBe("#aabbcc")
  })

  it("accepts function formats and normalizes to hex", async () => {
    const rgb = await colorConverterEngine.run({ color: "rgb(255, 255, 255)" })
    expect(rgb.output.hex).toBe("#ffffff")
    const cmyk = await colorConverterEngine.run({ color: "cmyk(0%, 0%, 0%, 100%)" })
    expect(cmyk.output.hex).toBe("#000000")
  })

  it("accepts named colors and normalizes to lowercase hex", async () => {
    const result = await colorConverterEngine.run({ color: "orange" })
    expect(result.output.hex).toBe("#ffa500")
    expect(result.output.rgb).toBe("rgb(255, 165, 0)")
  })

  it("round-trips hsl input through rgb and back", async () => {
    const result = await colorConverterEngine.run({ color: "hsl(210, 100%, 50%)" })
    expect(result.output.rgb).toBe("rgb(0, 128, 255)")
  })

  it("rejects invalid values instead of clamping silently", async () => {
    const error = await colorConverterEngine
      .run({ color: "rgb(300, 0, 0)" })
      .catch((e: unknown) => e)
    expect(error).toBeDefined()
    const error2 = await colorConverterEngine
      .run({ color: "hsl(0, 500%, 0%)" })
      .catch((e: unknown) => e)
    expect(error2).toBeDefined()
  })

  it("rejects empty input", async () => {
    const error = await colorConverterEngine.run({ color: "  " }).catch((e: unknown) => e)
    expect(error).toBeDefined()
  })
})
