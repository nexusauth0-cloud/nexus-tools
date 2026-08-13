import { create as createQrCode, type QRCodeErrorCorrectionLevel } from "qrcode"
import {
  QR_MAX_VERSION,
  QR_MIN_VERSION,
  type QrGeneratedMatrix,
  type QrGenerationOptions,
} from "./types"
import { buildPayload, QrPayloadError } from "./payload"

/**
 * QR matrix generation via the `qrcode` library's pure matrix API.
 *
 * `QRCode.create` never touches the DOM, canvas, or network — it returns a
 * module matrix we render ourselves (SVG string / canvas / PNG bytes).
 * UTF-8 data (unicode, emoji, CJK, Arabic) is encoded in Byte mode.
 */

export function buildPayloadForOptions(options: QrGenerationOptions): string {
  return buildPayload(options.input)
}

/** Generate the dark-module matrix for a payload + render options. */
export function generateQrMatrix(options: QrGenerationOptions): QrGeneratedMatrix {
  if (options.render.size < 96 || options.render.size > 1024 || options.render.size % 16 !== 0) {
    throw new QrPayloadError("Image size must be between 96 and 1024 pixels in steps of 16.")
  }
  if (options.render.margin < 0 || options.render.margin > 8) {
    throw new QrPayloadError("Margin must be between 0 and 8 modules.")
  }
  if (options.maxVersion !== undefined) {
    if (options.maxVersion < QR_MIN_VERSION || options.maxVersion > QR_MAX_VERSION) {
      throw new QrPayloadError(
        `QR version must be between ${QR_MIN_VERSION} and ${QR_MAX_VERSION}.`
      )
    }
  }

  const payload = buildPayloadForOptions(options)
  const created = createQrCode(payload, {
    errorCorrectionLevel: toQrCodeLevel(options.render.errorCorrectionLevel),
    ...(options.maxVersion !== undefined ? { version: options.maxVersion } : {}),
  })

  const version = created.version
  const modulesEdge = created.modules.size
  const rawModules = created.modules.data as Uint8Array
  const modules = Array.from(rawModules, (value) => value === 1)

  const margin = options.render.margin
  const totalSize = modulesEdge + margin * 2
  const expanded: boolean[] = new Array(totalSize * totalSize).fill(false)
  for (let row = 0; row < modulesEdge; row++) {
    for (let col = 0; col < modulesEdge; col++) {
      if (modules[row * modulesEdge + col]) {
        expanded[(row + margin) * totalSize + col + margin] = true
      }
    }
  }

  return {
    modules: expanded,
    size: totalSize,
    version,
    characterCount: payload.length,
    payload,
  }
}

export function toQrCodeLevel(level: "L" | "M" | "Q" | "H"): QRCodeErrorCorrectionLevel {
  return level
}

/** Module coordinates for one cell (for canvas/SVG renderers). */
export function cellRect(
  moduleIndex: number,
  size: number,
  scale: number
): { x: number; y: number; w: number; h: number } {
  const row = Math.floor(moduleIndex / size)
  const col = moduleIndex % size
  return { x: col * scale, y: row * scale, w: scale, h: scale }
}
