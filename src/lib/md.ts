/**
 * Pure-JavaScript MD5 (RFC 1321) for browsers.
 *
 * Web Crypto's `crypto.subtle.digest` does not support MD5, so a small
 * self-contained implementation is provided. MD5 is broken for
 * security-critical use — tools calling this must label it legacy.
 *
 * The implementation follows the reference C code from RFC 1321: message
 * bytes are loaded as little-endian 32-bit words and the digest is
 * serialized little-endian, matching the canonical hex output.
 */

const S: number[] = [
  7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14,
  20, 5, 9, 14, 20, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 6, 10, 15, 21, 6,
  10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21,
]

const K: number[] = Array.from({ length: 64 }, (_, index) =>
  Math.floor(Math.abs(Math.sin(index + 1)) * 2 ** 32)
)

const INITIAL_A = 0x67452301
const INITIAL_B = 0xefcdab89
const INITIAL_C = 0x98badcfe
const INITIAL_D = 0x10325476

export function md5Hex(input: string): string {
  const message = utf8Bytes(input)
  const padded = new Uint8Array((((message.length + 8) >> 6) << 6) + 64)
  padded.set(message)
  padded[message.length] = 0x80

  const bitLength = message.length * 8
  writeUint64LE(padded, padded.length - 8, bitLength)

  let a = INITIAL_A
  let b = INITIAL_B
  let c = INITIAL_C
  let d = INITIAL_D
  const words = new Uint32Array(16)

  for (let offset = 0; offset < padded.length; offset += 64) {
    for (let index = 0; index < 16; index += 1) {
      words[index] = readUint32LE(padded, offset + index * 4)
    }

    const a0 = a
    const b0 = b
    const c0 = c
    const d0 = d

    let round = 0
    while (round < 64) {
      let f: number
      let g: number
      if (round < 16) {
        f = (b & c) | (~b & d)
        g = round
      } else if (round < 32) {
        f = (d & b) | (~d & c)
        g = (5 * round + 1) % 16
      } else if (round < 48) {
        f = b ^ c ^ d
        g = (3 * round + 5) % 16
      } else {
        f = c ^ (b | ~d)
        g = (7 * round) % 16
      }

      const temp = d
      d = c
      c = b
      b = (b + rotateLeft(a + f + K[round] + words[g], S[round])) >>> 0
      a = temp
      round += 1
    }

    a = (a0 + a) >>> 0
    b = (b0 + b) >>> 0
    c = (c0 + c) >>> 0
    d = (d0 + d) >>> 0
  }

  return toHexLE([a, b, c, d])
}

function utf8Bytes(input: string): Uint8Array {
  if (typeof TextEncoder !== "undefined") return new TextEncoder().encode(input)
  return Uint8Array.from(unescape(encodeURIComponent(input)), (char) => char.charCodeAt(0))
}

/** Write an unsigned 64-bit bit length as little-endian bytes. */
function writeUint64LE(target: Uint8Array, offset: number, value: number): void {
  const low = value >>> 0
  const high = Math.floor(value / 2 ** 32)
  target[offset] = low & 0xff
  target[offset + 1] = (low >>> 8) & 0xff
  target[offset + 2] = (low >>> 16) & 0xff
  target[offset + 3] = (low >>> 24) & 0xff
  target[offset + 4] = high & 0xff
  target[offset + 5] = (high >>> 8) & 0xff
  target[offset + 6] = (high >>> 16) & 0xff
  target[offset + 7] = (high >>> 24) & 0xff
}

function readUint32LE(source: Uint8Array, offset: number): number {
  return (
    source[offset] |
    (source[offset + 1] << 8) |
    (source[offset + 2] << 16) |
    (source[offset + 3] << 24)
  )
}

/** Serialize four 32-bit words little-endian (canonical MD5 output). */
function toHexLE(words: number[]): string {
  let hex = ""
  for (const word of words) {
    hex +=
      (word & 0xff).toString(16).padStart(2, "0") +
      ((word >>> 8) & 0xff).toString(16).padStart(2, "0") +
      ((word >>> 16) & 0xff).toString(16).padStart(2, "0") +
      ((word >>> 24) & 0xff).toString(16).padStart(2, "0")
  }
  return hex
}

function rotateLeft(value: number, shift: number): number {
  return ((value << shift) | (value >>> (32 - shift))) >>> 0
}
