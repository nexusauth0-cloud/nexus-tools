/**
 * Minimal dependency-free PNG encoder (RGBA, 8-bit, no filtering).
 *
 * Uses stored (uncompressed) DEFLATE blocks — valid per the PNG spec and
 * byte-stable, which matters for deterministic tests. QR images are small,
 * so the lack of compression is acceptable; browsers use canvas PNG export
 * (which does compress) for downloads/previews.
 */

const CRC_TABLE = (() => {
  const table = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    }
    table[n] = c >>> 0
  }
  return table
})()

function crc32(bytes: Uint8Array): number {
  let c = 0xffffffff
  for (let i = 0; i < bytes.length; i++) {
    c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8)
  }
  return (c ^ 0xffffffff) >>> 0
}

function chunk(type: string, data: Uint8Array): Uint8Array {
  const length = new Uint8Array(4)
  new DataView(length.buffer).setUint32(0, data.length)
  const typeBytes = new TextEncoder().encode(type)
  const crcInput = new Uint8Array(typeBytes.length + data.length)
  crcInput.set(typeBytes, 0)
  crcInput.set(data, typeBytes.length)
  const crc = new Uint8Array(4)
  new DataView(crc.buffer).setUint32(0, crc32(crcInput))
  const out = new Uint8Array(length.length + typeBytes.length + data.length + crc.length)
  out.set(length, 0)
  out.set(typeBytes, length.length)
  out.set(data, length.length + typeBytes.length)
  out.set(crc, length.length + typeBytes.length + data.length)
  return out
}

/** Build a stored (uncompressed) zlib stream for the raw scanline data. */
function zlibStored(data: Uint8Array): Uint8Array {
  const header = new Uint8Array([0x78, 0x01]) // CMF=0x78, FLG=0x01 (no dict, max check)
  const total = data.length
  const out: number[] = []
  let offset = 0
  let blockIndex = 0
  while (offset < total) {
    const remaining = total - offset
    const len = Math.min(65535, remaining)
    const finalFlag = offset + len >= total ? 1 : 0
    out.push(0x00 | (finalFlag << 0)) // BTYPE=00 (stored), BFINAL set on last block
    out.push(len & 0xff, (len >> 8) & 0xff, ~len & 0xff & 0xff, (~len >> 8) & 0xff & 0xff)
    for (let i = 0; i < len; i++) out.push(data[offset + i])
    offset += len
    blockIndex++
  }
  void blockIndex
  const adler = adler32(data)
  const tail = new Uint8Array(4)
  new DataView(tail.buffer).setUint32(0, adler)
  const body = new Uint8Array(out)
  const result = new Uint8Array(header.length + body.length + tail.length)
  result.set(header, 0)
  result.set(body, header.length)
  result.set(tail, header.length + body.length)
  return result
}

function adler32(data: Uint8Array): number {
  let a = 1
  let b = 0
  for (let i = 0; i < data.length; i++) {
    a = (a + data[i]) % 65521
    b = (b + a) % 65521
  }
  return ((b << 16) | a) >>> 0
}

/** Scanlines are filtered with filter type 0 (None) so stored blocks are byte-exact. */
function rawScanlines(rgba: Uint8Array, width: number, height: number): Uint8Array {
  const rowBytes = width * 4
  const out = new Uint8Array((rowBytes + 1) * height)
  for (let row = 0; row < height; row++) {
    out[row * (rowBytes + 1)] = 0
    out.set(rgba.subarray(row * rowBytes, (row + 1) * rowBytes), row * (rowBytes + 1) + 1)
  }
  return out
}

/** Encode RGBA pixels (width*height*4 bytes) as a PNG byte buffer. */
export function encodePng(rgba: Uint8Array, width: number, height: number): Uint8Array {
  if (rgba.length !== width * height * 4) {
    throw new Error(
      `encodePng: pixel buffer size mismatch (${rgba.length} != ${width * height * 4})`
    )
  }

  const signature = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])

  const ihdrData = new Uint8Array(13)
  const view = new DataView(ihdrData.buffer)
  view.setUint32(0, width)
  view.setUint32(4, height)
  ihdrData[8] = 8 // bit depth
  ihdrData[9] = 6 // color type RGBA
  ihdrData[10] = 0 // compression
  ihdrData[11] = 0 // filter
  ihdrData[12] = 0 // interlace

  const idatData = zlibStored(rawScanlines(rgba, width, height))

  const ihdr = chunk("IHDR", ihdrData)
  const idat = chunk("IDAT", idatData)
  const iend = chunk("IEND", new Uint8Array(0))

  const out = new Uint8Array(signature.length + ihdr.length + idat.length + iend.length)
  let offset = 0
  for (const part of [signature, ihdr, idat, iend]) {
    out.set(part, offset)
    offset += part.length
  }
  return out
}

/** Render a QR matrix to RGBA pixels (true = dark module). */
export function matrixToRgba(
  modules: boolean[],
  size: number,
  scale: number,
  foreground: [number, number, number],
  background: [number, number, number]
): { rgba: Uint8Array; width: number; height: number } {
  const width = size * scale
  const height = size * scale
  const rgba = new Uint8Array(width * height * 4)
  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      const dark = modules[Math.floor(row / scale) * size + Math.floor(col / scale)]
      const [r, g, b] = dark ? foreground : background
      const idx = (row * width + col) * 4
      rgba[idx] = r
      rgba[idx + 1] = g
      rgba[idx + 2] = b
      rgba[idx + 3] = 255
    }
  }
  return { rgba, width, height }
}

/** Parse a hex color (#rgb / #rrggbb) to an RGB tuple; throws on invalid input. */
export function hexToRgb(hex: string): [number, number, number] {
  const match = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex.trim())
  if (!match) throw new Error(`Invalid color "${hex}". Use #rgb or #rrggbb.`)
  const raw = match[1]
  const full =
    raw.length === 3
      ? raw
          .split("")
          .map((c) => c + c)
          .join("")
      : raw
  const value = parseInt(full, 16)
  return [(value >> 16) & 0xff, (value >> 8) & 0xff, value & 0xff]
}
