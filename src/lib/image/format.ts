import type { ImageFormat } from "./types"

/**
 * Pure byte-level image probing.
 *
 * All parsing here is defensive: it never throws on truncated input and
 * never trusts the file extension or declared MIME type. The browser's
 * decoder remains the final authority — these routines only gate what we
 * offer in the UI and what the pipeline accepts.
 */

export interface ImageDimensions {
  format: ImageFormat
  width: number
  height: number
}

function readUInt16BE(bytes: Uint8Array, offset: number): number {
  return ((bytes[offset] ?? 0) << 8) | (bytes[offset + 1] ?? 0)
}

function readUInt32BE(bytes: Uint8Array, offset: number): number {
  return (
    ((bytes[offset] ?? 0) << 24) |
    ((bytes[offset + 1] ?? 0) << 16) |
    ((bytes[offset + 2] ?? 0) << 8) |
    (bytes[offset + 3] ?? 0)
  )
}

function ascii(bytes: Uint8Array, offset: number, length: number): string {
  let out = ""
  for (let i = 0; i < length; i++) out += String.fromCharCode(bytes[offset + i] ?? 0)
  return out
}

/** Identifies the real format from a file's magic bytes; null when unknown. */
export function detectImageFormat(bytes: Uint8Array): ImageFormat | null {
  if (bytes.length < 4) return null

  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "jpeg"
  }

  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return "png"
  }

  if (bytes.length >= 16 && ascii(bytes, 0, 4) === "RIFF" && ascii(bytes, 8, 4) === "WEBP") {
    const brand = ascii(bytes, 12, 4)
    if (brand === "VP8 " || brand === "VP8L" || brand === "VP8X") {
      return "webp"
    }
    return null
  }

  if (bytes.length >= 16 && ascii(bytes, 4, 4) === "ftyp") {
    const brand = ascii(bytes, 8, 4)
    if (brand === "avif" || brand === "avis") {
      return "avif"
    }
  }

  return null
}

/** Reads the pixel dimensions from the image's own header. Null when unreadable. */
export function readImageDimensions(bytes: Uint8Array): ImageDimensions | null {
  const format = detectImageFormat(bytes)
  if (!format) return null

  if (format === "png") {
    if (bytes.length < 24) return null
    const width = readUInt32BE(bytes, 16)
    const height = readUInt32BE(bytes, 20)
    if (width === 0 || height === 0) return null
    return { format, width, height }
  }

  if (format === "jpeg") {
    return readJpegDimensions(bytes)
  }

  if (format === "webp") {
    return readWebpDimensions(bytes)
  }

  return null
}

/**
 * Walks JPEG marker segments to the first Start-Of-Frame marker.
 * Each segment is `FF <marker> <length:BE16> <payload>`; standalone
 * markers (SOI, EOI, TEM, RSTx) carry no length field.
 */
function readJpegDimensions(bytes: Uint8Array): ImageDimensions | null {
  const length = bytes.length
  let offset = 2
  let guards = 0

  while (offset < length - 1 && guards < 64) {
    guards += 1
    if (bytes[offset] !== 0xff) return null
    // Skip possible filler 0xff bytes and stuffed 0x00.
    while (offset < length - 1 && bytes[offset] === 0xff) offset += 1
    const marker = bytes[offset]
    offset += 1

    if (marker === 0x00) continue // stuffed byte
    if (marker === 0xd9 || marker === 0xd8) return null // EOI / SOI
    if (marker >= 0xd0 && marker <= 0xd7) continue // RST — standalone

    if (isStartOfFrame(marker)) {
      if (offset + 6 >= length) return null
      const height = readUInt16BE(bytes, offset + 3)
      const width = readUInt16BE(bytes, offset + 5)
      if (width === 0 || height === 0) return null
      return { format: "jpeg", width, height }
    }

    if (offset + 1 >= length) return null
    const segmentLength = readUInt16BE(bytes, offset)
    if (segmentLength < 2) return null
    offset += segmentLength
  }

  return null
}

function isStartOfFrame(marker: number): boolean {
  // SOF0–SOF15, excluding DHT (C4), JPG (C8), DAC (CC).
  if (marker < 0xc0 || marker > 0xcf) return false
  return marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc
}

/** Reads dimensions from any of the three WebP container variants. */
function readWebpDimensions(bytes: Uint8Array): ImageDimensions | null {
  const brand = ascii(bytes, 12, 4)
  if (brand === "VP8X") {
    if (bytes.length < 30) return null
    // Chunk header: "VP8X" (12..15), size (16..19), payload (20..).
    // Payload: flags (20), canvas width-1 (21..23 LE), canvas height-1 (24..26 LE).
    const width = 1 + readUInt24LE(bytes, 21)
    const height = 1 + readUInt24LE(bytes, 24)
    if (width === 0 || height === 0) return null
    return { format: "webp", width, height }
  }

  if (brand === "VP8L") {
    if (bytes.length < 25) return null
    const signature = bytes[20]
    if (signature !== 0x2f) return null
    const value =
      (bytes[21] ?? 0) |
      ((bytes[22] ?? 0) << 8) |
      ((bytes[23] ?? 0) << 16) |
      ((bytes[24] ?? 0) << 24)
    const width = ((value >> 1) & 0x3fff) + 1
    const height = ((value >> 15) & 0x3fff) + 1
    if (width === 0 || height === 0) return null
    return { format: "webp", width, height }
  }

  if (brand === "VP8 ") {
    if (bytes.length < 30) return null
    if (bytes[23] !== 0x9d || bytes[24] !== 0x01 || bytes[25] !== 0x2a) return null
    const width = readUInt16LE(bytes, 26) & 0x3fff & 0x3fff
    const height = readUInt16LE(bytes, 28) & 0x3fff & 0x3fff
    if (width === 0 || height === 0) return null
    return { format: "webp", width, height }
  }

  return null
}

function readUInt16LE(bytes: Uint8Array, offset: number): number {
  return (bytes[offset] ?? 0) | ((bytes[offset + 1] ?? 0) << 8)
}

function readUInt24LE(bytes: Uint8Array, offset: number): number {
  return (bytes[offset] ?? 0) | ((bytes[offset + 1] ?? 0) << 8) | ((bytes[offset + 2] ?? 0) << 16)
}

/** Round-trips format information for a byte array; null when unrecognized. */
export function probeImage(bytes: Uint8Array): {
  format: ImageFormat
  width: number
  height: number
} | null {
  return readImageDimensions(bytes)
}
