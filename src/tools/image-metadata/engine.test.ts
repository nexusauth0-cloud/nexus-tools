import { describe, expect, it } from "vitest"
import { pngBytes } from "@/lib/image/testing/fixtures"
import { imageMetadataEngine } from "./engine"

/**
 * Builds a JPEF wrapper around an EXIF TIFF payload
 * (SOI + APP1("Exif"<null><null>) + tiff + EOI).
 */
function jpegWithExif(tiff: Uint8Array): Uint8Array {
  const app1 = new Uint8Array(2 + 2 + 6 + tiff.length)
  const length = 2 + 6 + tiff.length
  app1.set([0xff, 0xe1], 0)
  app1.set([(length >>> 8) & 0xff, length & 0xff], 2)
  app1.set([0x45, 0x78, 0x69, 0x66, 0x00, 0x00], 4)
  app1.set(tiff, 10)

  const jpeg = new Uint8Array(2 + app1.length + 2)
  jpeg.set([0xff, 0xd8], 0)
  jpeg.set(app1, 2)
  jpeg.set([0xff, 0xd9], 2 + app1.length)
  return jpeg
}

/** A simple TIFF carrying one SHORT entry (orientation). */
function orientationTiff(orientation: number): Uint8Array {
  const tiff = new Uint8Array(34)
  tiff.set([0x49, 0x49, 0x2a, 0x00], 0)
  tiff.set([0x08, 0x00, 0x00, 0x00], 4) // IFD0 offset
  tiff.set([0x01, 0x00], 8) // one entry
  tiff.set([0x12, 0x01, 0x03, 0x00], 10) // tag 0x0112 SHORT
  tiff.set([0x01, 0x00, 0x00, 0x00], 14) // count 1
  tiff.set([orientation, 0x00, 0x00, 0x00], 18) // value inline
  tiff.set([0x00, 0x00, 0x00, 0x00], 22) // next IFD
  return tiff
}

/** A TIFF exposing a GPS IFD with latitude/longitude values. */
function gpsTiff(): Uint8Array {
  const tiff = new Uint8Array(160)
  tiff.set([0x49, 0x49, 0x2a, 0x00], 0)
  tiff.set([0x08, 0x00, 0x00, 0x00], 4)

  // IFD0: 1 entry — GPSInfo pointer (0x8825) → 40
  tiff.set([0x01, 0x00], 8)
  tiff.set([0x25, 0x88, 0x04, 0x00], 10)
  tiff.set([0x01, 0x00, 0x00, 0x00], 14)
  tiff.set([0x28, 0x00, 0x00, 0x00], 18)
  tiff.set([0x00, 0x00, 0x00, 0x00], 22) // next IFD

  // GPS IFD @40: 4 entries (lat ref, lat, lng ref, lng)
  tiff.set([0x04, 0x00], 40)
  const gpsEntry = (at: number, tag: number, type: number, count: number, value: number) => {
    tiff.set([tag & 0xff, (tag >>> 8) & 0xff, type & 0xff, (type >>> 8) & 0xff], at)
    tiff.set([count & 0xff, (count >>> 8) & 0xff, 0, 0], at + 4)
    tiff.set(
      [value & 0xff, (value >>> 8) & 0xff, (value >>> 16) & 0xff, (value >>> 24) & 0xff],
      at + 8
    )
  }
  gpsEntry(42, 0x0001, 2, 2, 0x4e) // GPSLatitudeRef "N" inline
  gpsEntry(54, 0x0002, 5, 3, 112) // GPSLatitude rationals inline→112
  gpsEntry(66, 0x0003, 2, 2, 0x45) // GPSLongitudeRef "E"
  gpsEntry(78, 0x0004, 5, 3, 136) // GPSLongitude rationals →136
  tiff.set([0x00, 0x00, 0x00, 0x00], 90) // next IFD

  // 51°30'00" N → 51.5
  tiff.set([51, 0, 0, 0, 1, 0, 0, 0], 112)
  tiff.set([30, 0, 0, 0, 1, 0, 0, 0], 120)
  tiff.set([0, 0, 0, 0, 1, 0, 0, 0], 128)
  // 18°15'00" E → 18.25
  tiff.set([18, 0, 0, 0, 1, 0, 0, 0], 136)
  tiff.set([15, 0, 0, 0, 1, 0, 0, 0], 144)
  tiff.set([0, 0, 0, 0, 1, 0, 0, 0], 152)
  return tiff
}

describe("imageMetadataEngine", () => {
  it("reports basic facts for an image without EXIF", async () => {
    const source = pngBytes(640, 480)
    const result = await imageMetadataEngine.run({ bytes: source, bytesLength: source.length })
    expect(result.output).toMatchObject({
      format: "png",
      width: 640,
      height: 480,
      bytes: source.length,
      exif: false,
      hasGps: false,
      entryCount: 0,
    })
  })

  it("reads orientation EXIF from a JPEG", async () => {
    const jpeg = jpegWithExif(orientationTiff(6))
    const result = await imageMetadataEngine.run({ bytes: jpeg, bytesLength: jpeg.length })
    expect(result.output.exif).toBe(true)
    expect(result.output.orientation?.id).toBe(6)
    expect(result.output.orientation?.label).toContain("Rotated")
    expect(result.output.entryCount).toBe(1)
  })

  it("surfaces a GPS-presence flag without coordinates", async () => {
    const jpeg = jpegWithExif(gpsTiff())
    const result = await imageMetadataEngine.run({ bytes: jpeg, bytesLength: jpeg.length })
    expect(result.output.exif).toBe(true)
    expect(result.output.hasGps).toBe(true)
    // The record must never carry coordinates.
    expect(result.output).not.toHaveProperty("latitude")
    expect(result.output).not.toHaveProperty("longitude")
    expect(result.output).not.toHaveProperty("gps")
  })
})
