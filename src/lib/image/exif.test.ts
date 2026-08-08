import { describe, expect, it } from "vitest"
import { parseExif } from "./exif"

/**
 * Deterministic little-endian TIFF/EXIF builder used to synthesize JPEG
 * files with APP1 EXIF segments for parser tests.
 */

interface IfdEntry {
  tag: number
  type: number
  /** Numeric value for SHORT/BYTE entries. */
  value?: number
  /** ASCII text (writer appends the trailing NUL). */
  text?: string
  /** RATIONAL pairs. */
  rationals?: [number, number][]
  /** LONG pointer entries that reference a sub-IFD in the same TIFF. */
  to?: "exif" | "gps"
}

function u16(value: number): Uint8Array {
  return Uint8Array.from([value & 0xff, (value >>> 8) & 0xff])
}

function u32(value: number): Uint8Array {
  return Uint8Array.from([
    value & 0xff,
    (value >>> 8) & 0xff,
    (value >>> 16) & 0xff,
    (value >>> 24) & 0xff,
  ])
}

function asciiWithNul(text: string): Uint8Array {
  const out = new Uint8Array(text.length + 1)
  for (let i = 0; i < text.length; i++) out[i] = text.charCodeAt(i)
  return out
}

/** Component count of an entry's value, used for the directory count field. */
function valueSize(entry: IfdEntry): number {
  if (entry.type === 2) return (entry.text?.length ?? 0) + 1
  if (entry.type === 5) return entry.rationals?.length ?? 1
  return 1
}

function concat(parts: Uint8Array[]): Uint8Array {
  let length = 0
  for (const part of parts) length += part.length
  const out = new Uint8Array(length)
  let offset = 0
  for (const part of parts) {
    out.set(part, offset)
    offset += part.length
  }
  return out
}

interface TiffSpec {
  ifd0: IfdEntry[]
  exif?: IfdEntry[]
  gps?: IfdEntry[]
}

/** Absolute offsets of each IFD block are resolved here in one pass. */
function assembleTiff(spec: TiffSpec): Uint8Array {
  const blockSize = (list: IfdEntry[] | undefined): number =>
    list !== undefined ? 2 + list.length * 12 + 4 : 0

  const ifd0Size = blockSize(spec.ifd0)
  const exifSize = blockSize(spec.exif)
  const gpsSize = blockSize(spec.gps)

  // Overflow layout: ifd0 → exif → gps, each immediately after its dir.
  const ifd0Over = overflowStartFor(spec.ifd0)
  const exifStart = 8 + ifd0Size + ifd0Over.length
  const exifOverStart = exifStart + exifSize
  const gpsStart = exifOverStart + overflowStartFor(spec.exif ?? []).length
  const gpsOverStart = gpsStart + gpsSize

  const block = (
    list: IfdEntry[] | undefined,
    dirStart: number,
    overflowStart: number
  ): {
    dir: Uint8Array
    overflow: Uint8Array
    pointerPositions: Array<{ at: number; target: "exif" | "gps" }>
  } =>
    list === undefined
      ? { dir: new Uint8Array(0), overflow: new Uint8Array(0), pointerPositions: [] }
      : assembleIfd(list, { dirStart, overflowStart })

  const ifd0 = block(spec.ifd0, 8, 8 + ifd0Size)
  const exif = block(spec.exif, exifStart, exifOverStart)
  const gps = block(spec.gps, gpsStart, gpsOverStart)

  const total =
    8 +
    ifd0.dir.length +
    ifd0.overflow.length +
    exif.dir.length +
    exif.overflow.length +
    gps.dir.length +
    gps.overflow.length

  const tiff = new Uint8Array(total)
  tiff.set([0x49, 0x49, 0x2a, 0x00], 0) // "II*\0"
  tiff.set(u32(8), 4) // IFD0 at offset 8

  let cursor = 8
  for (const part of [ifd0, exif, gps]) {
    tiff.set(part.dir, cursor)
    cursor += part.dir.length
    tiff.set(part.overflow, cursor)
    cursor += part.overflow.length
  }

  for (const { at, target } of [
    ...ifd0.pointerPositions,
    ...exif.pointerPositions,
    ...gps.pointerPositions,
  ]) {
    const dst = target === "exif" ? exifStart : gpsStart
    tiff.set(u32(dst), at)
  }

  return tiff
}

function overflowStartFor(list: IfdEntry[]): Uint8Array {
  const parts: Uint8Array[] = []
  for (const entry of list) {
    if (entry.type === 2) {
      const bytes = asciiWithNul(entry.text ?? "")
      if (bytes.length > 4) parts.push(bytes)
    } else if (entry.type === 5) {
      for (const [num, den] of entry.rationals ?? []) parts.push(u32(num), u32(den))
    }
  }
  return concat(parts)
}

function assembleIfd(
  entries: IfdEntry[],
  layout: { dirStart: number; overflowStart: number }
): {
  dir: Uint8Array
  overflow: Uint8Array
  pointerPositions: Array<{ at: number; target: "exif" | "gps" }>
} {
  const dir = new Uint8Array(2 + entries.length * 12 + 4)
  const overflow: Uint8Array[] = []
  const pointerPositions: Array<{ at: number; target: "exif" | "gps" }> = []
  let overflowCursor = layout.overflowStart

  dir.set(u16(entries.length), 0)

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i]
    const at = 2 + i * 12
    dir.set(u16(entry.tag), at)
    dir.set(u16(entry.type), at + 2)
    dir.set(u32(valueSize(entry)), at + 4)

    if (entry.to) {
      pointerPositions.push({ at: layout.dirStart + at + 8, target: entry.to })
      continue
    }

    if (entry.type === 5) {
      const bytes = concat((entry.rationals ?? []).flatMap(([num, den]) => [u32(num), u32(den)]))
      if (bytes.length <= 4) {
        dir.set(bytes, at + 8)
      } else {
        dir.set(u32(overflowCursor), at + 8)
        overflow.push(bytes)
        overflowCursor += bytes.length
      }
      continue
    }

    if (entry.type === 2) {
      const bytes = asciiWithNul(entry.text ?? "")
      if (bytes.length <= 4) {
        dir.set(bytes, at + 8)
      } else {
        dir.set(u32(overflowCursor), at + 8)
        overflow.push(bytes)
        overflowCursor += bytes.length
      }
      continue
    }

    if (entry.type === 3 && typeof entry.value === "number") {
      dir.set(u16(entry.value), at + 8)
      continue
    }
    if (entry.type === 1 && typeof entry.value === "number") {
      dir[at + 8] = entry.value
      continue
    }
    // LONG / unknown — inline as-is (4 bytes of the slot).
  }

  dir.set(u32(0), 2 + entries.length * 12)
  return { dir, overflow: concat(overflow), pointerPositions }
}

export function jpegWithTiff(tiff: Uint8Array): Uint8Array {
  const marker = Uint8Array.from([0xff, 0xe1])
  const length = 2 + 6 + tiff.length // own length field + "Exif\0\0" + payload
  const lengthField = Uint8Array.from([(length >>> 8) & 0xff, length & 0xff])
  const exifId = Uint8Array.from([0x45, 0x78, 0x69, 0x66, 0x00, 0x00])
  return concat([
    Uint8Array.from([0xff, 0xd8]),
    marker,
    lengthField,
    exifId,
    tiff,
    Uint8Array.from([0xff, 0xd9]),
  ])
}

describe("parseExif", () => {
  it("returns found:false for files without EXIF", () => {
    const bytes = Uint8Array.from([
      0xff, 0xd8, 0xff, 0xe0, 0x00, 0x02, 0x74, 0x65, 0x73, 0x74, 0xff, 0xd9,
    ])
    expect(parseExif(bytes).found).toBe(false)
  })

  it("returns found:false for empty and truncated input", () => {
    expect(parseExif(new Uint8Array(0)).found).toBe(false)
    expect(parseExif(Uint8Array.from([0xff, 0xd8])).found).toBe(false)
    expect(parseExif(jpegWithTiff(new Uint8Array(3))).found).toBe(false)
  })

  it("parses orientation from a bare EXIF block", () => {
    const tiff = assembleTiff({ ifd0: [{ tag: 0x0112, type: 3, value: 6 }] })
    const result = parseExif(jpegWithTiff(tiff))
    expect(result.found).toBe(true)
    expect(result.orientation?.id).toBe(6)
    expect(result.orientation?.label).toBe("Rotated 90° CW")
  })

  it("parses camera facts including date, exposure and lens", () => {
    const tiff = assembleTiff({
      ifd0: [
        { tag: 0x010f, type: 2, text: "TestCam" },
        { tag: 0x0110, type: 2, text: "X100" },
        { tag: 0x0131, type: 2, text: "v1.2.3" },
        { tag: 0x0132, type: 2, text: "2024:05:04 12:00:00" },
        { tag: 0x8769, type: 4, to: "exif" },
      ],
      exif: [
        { tag: 0x829a, type: 5, rationals: [[1, 250]] },
        { tag: 0x829d, type: 5, rationals: [[28, 10]] },
        { tag: 0x8827, type: 3, value: 400 },
        { tag: 0x920a, type: 5, rationals: [[50, 1]] },
        { tag: 0x9209, type: 3, value: 0x0011 },
        { tag: 0x9003, type: 2, text: "2024:05:04 12:00:01" },
        { tag: 0xa405, type: 3, value: 75 },
      ],
    })
    const result = parseExif(jpegWithTiff(tiff))
    expect(result.found).toBe(true)
    expect(result.make).toBe("TestCam")
    expect(result.model).toBe("X100")
    expect(result.software).toBe("v1.2.3")
    expect(result.dateTime).toBe("2024:05:04 12:00:00")
    expect(result.dateTimeOriginal).toBe("2024:05:04 12:00:01")
    expect(result.exposureTime).toBe("1/250 s")
    expect(result.fNumber).toBe(2.8)
    expect(result.iso).toBe(400)
    expect(result.focalLength).toBe(50)
    expect(result.focalLength35mm).toBe(75)
    expect(result.flash).toBe(true)
  })

  it("parses GPS coordinates and altitude direction", () => {
    const tiff = assembleTiff({
      ifd0: [{ tag: 0x8825, type: 4, to: "gps" }],
      gps: [
        { tag: 0x0001, type: 2, text: "N" },
        {
          tag: 0x0002,
          type: 5,
          rationals: [
            [51, 1],
            [30, 1],
            [1800, 3600],
          ],
        },
        { tag: 0x0003, type: 2, text: "E" },
        {
          tag: 0x0004,
          type: 5,
          rationals: [
            [18, 1],
            [15, 1],
            [900, 3600],
          ],
        },
        { tag: 0x0005, type: 1, value: 1 },
        { tag: 0x0006, type: 5, rationals: [[100, 3]] },
      ],
    })
    const result = parseExif(jpegWithTiff(tiff))
    expect(result.found).toBe(true)
    expect(result.gps).toBeDefined()
    expect(result.gps?.latitude).toBeCloseTo(51.5, 3)
    expect(result.gps?.longitude).toBeCloseTo(18.25, 3)
    expect(result.gps?.altitude).toBeCloseTo(-33.33, 1)
  })

  it("handles malformed TIFF payloads gracefully", () => {
    const bogus = Uint8Array.from([0x49, 0x49, 0x2a, 0x00, 0xff, 0xff, 0xff, 0xff, 0x00, 0x00])
    expect(parseExif(jpegWithTiff(bogus)).found).toBe(false)
  })
})
