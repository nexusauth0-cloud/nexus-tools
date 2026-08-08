/**
 * Minimal EXIF reader for JPEG files.
 *
 * Pure byte parsing (no browser APIs) so it is unit-testable under Node.
 * It deliberately reads only the fields the UI surfaces and never claims
 * to remove EXIF — these tools never strip or rewrite EXIF data.
 */

export interface ExifGps {
  /** Signed decimal degrees; null when the component is missing. */
  latitude: number | null
  longitude: number | null
  /** Meters above/below sea level; null when absent. */
  altitude: number | null
}

export interface ExifData {
  found: boolean
  make?: string
  model?: string
  software?: string
  imageDescription?: string
  dateTime?: string
  dateTimeOriginal?: string
  orientation?: { id: number; label: string }
  exposureTime?: string
  fNumber?: number
  iso?: number
  focalLength?: number
  focalLength35mm?: number
  flash?: boolean
  lensMake?: string
  lensModel?: string
  gps?: ExifGps
  /** Total number of EXIF entries read (IFD0 + Exif + GPS sub-IFDs). */
  entryCount: number
}

export const ORIENTATION_LABELS: Record<number, string> = {
  1: "Horizontal (normal)",
  2: "Mirrored horizontally",
  3: "Rotated 180°",
  4: "Mirrored vertically",
  5: "Rotated 90° CW and mirrored",
  6: "Rotated 90° CW",
  7: "Rotated 90° CCW and mirrored",
  8: "Rotated 270° CW",
}

const TIFF_BYTE = 1
const TIFF_ASCII = 2
const TIFF_SHORT = 3
const TIFF_LONG = 4
const TIFF_RATIONAL = 5
const TIFF_SBYTE = 6
const TIFF_UNDEFINED = 7
const TIFF_SRATIONAL = 10

interface ExifEntry {
  tag: number
  type: number
  /** Numeric value (SHORT/LONG/SBYTE, or the first RATIONAL numerator). */
  value: number
  /** RATIONAL component values: [num, den] or [deg, min, sec] decimals. */
  values?: [number, number] | [number, number, number]
  /** Decoded ASCII text (make, model, date, etc.). */
  text?: string
  /** Parsed sub-IFD (EXIF or GPS pointer tags). */
  subIfd?: Map<number, ExifEntry>
}

/** Extracts EXIF metadata from JPEG bytes. Never throws on malformed input. */
export function parseExif(jpegBytes: Uint8Array): ExifData {
  const app1 = findExifApp1(jpegBytes)
  if (!app1) return { found: false, entryCount: 0 }

  const tiff = parseTiff(app1)
  if (!tiff) return { found: false, entryCount: 0 }

  const data: ExifData = { found: true, entryCount: tiff.metaCount }
  const ifd0 = tiff.ifd0
  const read = (tag: number, ifd: Map<number, ExifEntry>): ExifEntry | undefined => ifd.get(tag)

  const make = read(0x010f, ifd0)
  const model = read(0x0110, ifd0)
  const orientation = read(0x0112, ifd0)
  const dateTime = read(0x0132, ifd0)
  const description = read(0x010e, ifd0)
  const software = read(0x0131, ifd0)

  if (make?.text) data.make = make.text.trim()
  if (model?.text) data.model = model.text.trim()
  if (description?.text) data.imageDescription = description.text.trim()
  if (software?.text) data.software = software.text.trim()
  if (dateTime?.text) data.dateTime = dateTime.text.trim()
  if (orientation && orientation.type === TIFF_SHORT) {
    data.orientation = {
      id: orientation.value,
      label: ORIENTATION_LABELS[orientation.value] ?? `Unknown rotation (${orientation.value})`,
    }
  }

  const exifPointer = read(0x8769, ifd0)
  if (exifPointer?.subIfd) {
    const exifIfd = exifPointer.subIfd
    data.entryCount += exifIfd.size

    const dateTimeOriginal = read(0x9003, exifIfd)
    const exposure = read(0x829a, exifIfd)
    const fNumber = read(0x829d, exifIfd)
    const iso = read(0x8827, exifIfd)
    const focal = read(0x920a, exifIfd)
    const flash = read(0x9209, exifIfd)
    const focal35 = read(0xa405, exifIfd)
    const lensMake = read(0xa433, exifIfd)
    const lensModel = read(0xa434, exifIfd)

    if (dateTimeOriginal?.text) data.dateTimeOriginal = dateTimeOriginal.text.trim()
    if (exposure?.values) {
      const [num, den] = exposure.values
      if (den !== 0) data.exposureTime = `${num}/${den} s`
    }
    if (fNumber?.values) {
      const [num, den] = fNumber.values
      if (den !== 0) data.fNumber = round2(num / den)
    }
    if (iso && iso.type === TIFF_SHORT) data.iso = iso.value
    if (focal?.values) {
      const [num, den] = focal.values
      if (den !== 0) data.focalLength = round2(num / den)
    }
    if (focal35 && focal35.type === TIFF_SHORT) data.focalLength35mm = focal35.value
    if (flash && flash.type === TIFF_SHORT) data.flash = (flash.value & 0x01) === 1
    if (lensMake?.text) data.lensMake = lensMake.text.trim()
    if (lensModel?.text) data.lensModel = lensModel.text.trim()
  }

  const gpsPointer = read(0x8825, ifd0)
  if (gpsPointer?.subIfd) {
    const gpsIfd = gpsPointer.subIfd
    data.entryCount += gpsIfd.size

    const gps: ExifGps = { latitude: null, longitude: null, altitude: null }
    const lat = read(0x0002, gpsIfd)
    const latRef = read(0x0001, gpsIfd)
    const lng = read(0x0004, gpsIfd)
    const lngRef = read(0x0003, gpsIfd)
    const alt = read(0x0006, gpsIfd)
    const altRef = read(0x0005, gpsIfd)

    if (lat?.values) {
      gps.latitude = dmsToDecimal(lat.values, latRef?.text?.trim() === "S" ? -1 : 1)
    }
    if (lng?.values) {
      gps.longitude = dmsToDecimal(lng.values, lngRef?.text?.trim() === "W" ? -1 : 1)
    }
    if (alt?.values) {
      const [num, den] = alt.values
      const belowSea = altRef ? altRef.value === 1 : false
      if (den !== 0) gps.altitude = (belowSea ? -1 : 1) * (num / den)
    }
    if (gps.latitude !== null || gps.longitude !== null || gps.altitude !== null) {
      data.gps = gps
    }
  }

  return data
}

interface ParsedTiff {
  metaCount: number
  ifd0: Map<number, ExifEntry>
}

/** Finds the APP1 segment that carries an "Exif" payload; returns its TIFF bytes. */
function findExifApp1(bytes: Uint8Array): Uint8Array | null {
  const length = bytes.length
  let offset = 2
  let guards = 0

  while (offset < length - 1 && guards < 32) {
    guards += 1
    if (bytes[offset] !== 0xff) return null
    while (offset < length - 1 && bytes[offset] === 0xff) offset += 1
    const marker = bytes[offset]
    offset += 1
    if (marker === 0x00) continue
    if (marker === 0xd9) return null

    if (offset + 1 >= length) return null
    const segmentLength = ((bytes[offset] << 8) | bytes[offset + 1]) & 0xffff
    if (segmentLength < 2) return null

    if (marker === 0xe1) {
      const payload = bytes.subarray(offset + 2, offset + segmentLength)
      if (
        payload.length >= 6 &&
        ascii(payload, 0, 4) === "Exif" &&
        payload[4] === 0 &&
        payload[5] === 0
      ) {
        return payload.subarray(6)
      }
      return null
    }
    offset += segmentLength
  }
  return null
}

function parseTiff(tiffBytes: Uint8Array): ParsedTiff | null {
  const length = tiffBytes.length
  if (length < 8) return null

  const little = ascii(tiffBytes, 0, 2) === "II"
  if (readU16(tiffBytes, 2, little) !== 0x2a) return null

  const ifdOffset = readU32(tiffBytes, 4, little)
  const main = readIfd(tiffBytes, ifdOffset, little)
  if (!main || main.ifd.size === 0) return null

  let metaCount = main.ifd.size

  const exifPointer = main.ifd.get(0x8769)
  if (exifPointer) {
    const sub = readIfd(tiffBytes, exifPointer.value, little)
    if (sub) {
      exifPointer.subIfd = sub.ifd
      metaCount += sub.ifd.size
    }
  }

  const gpsPointer = main.ifd.get(0x8825)
  if (gpsPointer) {
    const sub = readIfd(tiffBytes, gpsPointer.value, little)
    if (sub) {
      gpsPointer.subIfd = sub.ifd
      metaCount += sub.ifd.size
    }
  }

  return { metaCount, ifd0: main.ifd }
}

function readIfd(
  bytes: Uint8Array,
  offset: number,
  little: boolean
): { ifd: Map<number, ExifEntry> } | null {
  if (offset + 2 > bytes.length) return null
  const count = readU16(bytes, offset, little)
  if (count > 512) return null
  const ifd = new Map<number, ExifEntry>()

  for (let i = 0; i < count; i++) {
    const entryOffset = offset + 2 + i * 12
    if (entryOffset + 12 > bytes.length) break
    const tag = readU16(bytes, entryOffset, little)
    const type = readU16(bytes, entryOffset + 2, little)
    const componentCount = readU32(bytes, entryOffset + 4, little)
    const componentSize = typeSize(type)
    const totalBytes = componentSize ? componentSize * componentCount : 0

    const entry: ExifEntry = { tag, type, value: 0 }

    const inlineStart = entryOffset + 8
    if (type === TIFF_ASCII) {
      if (totalBytes <= 4) {
        entry.text = readAscii(bytes, inlineStart, componentCount)
      } else {
        const valueOffset = readU32(bytes, inlineStart, little)
        entry.text = readAscii(bytes, valueOffset, Math.min(componentCount, 4096))
      }
      ifd.set(tag, entry)
      continue
    }

    if (type === TIFF_RATIONAL || type === TIFF_SRATIONAL) {
      const valueOffset = totalBytes <= 4 ? inlineStart : readU32(bytes, inlineStart, little)
      entry.values = readRationals(bytes, valueOffset, componentCount, little)
      entry.value = entry.values?.[0] ?? 0
      ifd.set(tag, entry)
      continue
    }

    if (totalBytes <= 4) {
      entry.value =
        readU32(bytes, inlineStart, little) & (isShortScalar(type) ? 0xffff : 0xffffffff)
    } else {
      const valueOffset = readU32(bytes, inlineStart, little)
      entry.value =
        readU32(bytes, valueOffset, little) & (isShortScalar(type) ? 0xffff : 0xffffffff)
    }
    ifd.set(tag, entry)
  }

  return { ifd }
}

function isShortScalar(type: number): boolean {
  return type === TIFF_SHORT || type === TIFF_BYTE || type === TIFF_SBYTE
}

function typeSize(type: number): number | null {
  switch (type) {
    case TIFF_BYTE:
    case TIFF_ASCII:
    case TIFF_SBYTE:
    case TIFF_UNDEFINED:
      return 1
    case TIFF_SHORT:
      return 2
    case TIFF_LONG:
      return 4
    case TIFF_RATIONAL:
    case TIFF_SRATIONAL:
      return 8
    default:
      return null
  }
}

function readRationals(
  bytes: Uint8Array,
  offset: number,
  count: number,
  little: boolean
): [number, number] | [number, number, number] | undefined {
  if (count < 1 || count > 3 || offset + 8 * count > bytes.length) return undefined
  const num = readU32(bytes, offset, little)
  const den = readU32(bytes, offset + 4, little)
  if (count === 1 || count === 2) return [num, den]
  const minNum = readU32(bytes, offset + 8, little)
  const minDen = readU32(bytes, offset + 12, little)
  const secNum = readU32(bytes, offset + 16, little)
  const secDen = readU32(bytes, offset + 20, little)
  return [num / den, minNum / minDen, secNum / secDen]
}

function dmsToDecimal(values: [number, number] | [number, number, number], sign: number): number {
  const deg = values[0]
  const min = values[1] ?? 0
  const sec = values[2] ?? 0
  return sign * (Math.abs(deg) + Math.abs(min) / 60 + Math.abs(sec) / 3600)
}

function ascii(bytes: Uint8Array, offset: number, length: number): string {
  let out = ""
  for (let i = 0; i < length; i++) out += String.fromCharCode(bytes[offset + i] ?? 0)
  return out
}

function readAscii(bytes: Uint8Array, offset: number, length: number): string {
  const end = Math.min(bytes.length, offset + length)
  if (offset >= bytes.length) return ""
  let out = ""
  for (let i = offset; i < end; i++) {
    const code = bytes[i]
    if (code === 0) break
    out += String.fromCharCode(code)
  }
  return out
}

function readU16(bytes: Uint8Array, offset: number, little: boolean): number {
  if (offset + 1 >= bytes.length) return 0
  return little
    ? bytes[offset] | (bytes[offset + 1] << 8)
    : (bytes[offset] << 8) | bytes[offset + 1]
}

function readU32(bytes: Uint8Array, offset: number, little: boolean): number {
  if (offset + 3 >= bytes.length) return 0
  if (little) {
    return (
      bytes[offset] |
      (bytes[offset + 1] << 8) |
      (bytes[offset + 2] << 16) |
      (bytes[offset + 3] << 24)
    )
  }
  return (
    ((bytes[offset] << 24) |
      (bytes[offset + 1] << 16) |
      (bytes[offset + 2] << 8) |
      bytes[offset + 3]) >>>
    0
  )
}

function round2(value: number): number {
  return Math.round(value * 100) / 100
}
