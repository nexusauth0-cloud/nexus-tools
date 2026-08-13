import jsQR from "jsqr"
import { buildDecodedContent, type QrDecodedContent } from "./classify"

/**
 * QR decoding — pure RGBA input, environment-agnostic.
 *
 * The caller extracts pixels (browser: canvas ImageData; tests: pngjs) and
 * this module runs jsQR on them. Images never leave the client.
 */

export interface QrImageInput {
  /** RGBA pixel buffer (4 bytes per pixel). */
  data: Uint8Array | Uint8ClampedArray
  width: number
  height: number
}

export interface QrDecodeResult {
  ok: boolean
  content: QrDecodedContent | null
  /** Detected QR format info when the library reports it. */
  format: string | null
}

/** Shared "no QR found" result. */
export function noQrFound(): QrDecodeResult {
  return { ok: false, content: null, format: null }
}

/** Decode a single QR code from RGBA pixels. */
export function decodeQrFromRgba(input: QrImageInput): QrDecodeResult {
  const { data, width, height } = input
  if (width < 21 || height < 21) {
    return { ok: false, content: null, format: null }
  }
  if (data.length !== width * height * 4) {
    return { ok: false, content: null, format: null }
  }

  const decoded = jsQR(new Uint8ClampedArray(data), width, height)
  if (!decoded) return noQrFound()

  return {
    ok: true,
    content: buildDecodedContent(decoded.data),
    format: "QR (matrix code)",
  }
}
