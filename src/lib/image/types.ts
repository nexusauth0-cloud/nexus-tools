/** Canonical image formats the image tools work with. */
export const IMAGE_FORMATS = ["jpeg", "png", "webp", "avif"] as const
export type ImageFormat = (typeof IMAGE_FORMATS)[number]

export interface ImageFormatInfo {
  label: string
  /** MIME type used for decoding input and encoding output. */
  mime: string
  /** File extension used for downloads. */
  extension: string
  /** Whether a quality (compression) setting applies to this format. */
  qualityApplicable: boolean
  /** Whether the format is guaranteed by all supported browsers. */
  universallySupported: boolean
  canDecode: boolean
  canEncode: boolean
}

export const IMAGE_FORMAT_INFO: Record<ImageFormat, ImageFormatInfo> = {
  jpeg: {
    label: "JPEG",
    mime: "image/jpeg",
    extension: "jpg",
    qualityApplicable: true,
    universallySupported: true,
    canDecode: true,
    canEncode: true,
  },
  png: {
    label: "PNG",
    mime: "image/png",
    extension: "png",
    qualityApplicable: false,
    universallySupported: true,
    canDecode: true,
    canEncode: true,
  },
  webp: {
    label: "WebP",
    mime: "image/webp",
    extension: "webp",
    qualityApplicable: true,
    universallySupported: true,
    canDecode: true,
    canEncode: true,
  },
  avif: {
    label: "AVIF",
    mime: "image/avif",
    extension: "avif",
    qualityApplicable: true,
    universallySupported: false,
    canDecode: true,
    canEncode: false,
  },
}

/** Formats accepted as input. Only formats with full support (parse +
 * decode) are offered — no silent feature claims.
 */
export const INPUT_FORMATS: readonly ImageFormat[] = ["jpeg", "png", "webp"]

/** Formats we can produce (encode) without any dependency. */
export const OUTPUT_FORMATS: readonly ImageFormat[] = ["jpeg", "png", "webp"]

/** Hard cap for uploaded file bytes. The UI states this limit. */
export const MAX_IMAGE_FILE_BYTES = 20 * 1024 * 1024

/** Human file-size like "842 KB" or "1.4 MB". */
export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return "—"
  if (bytes < 1024) return `${bytes} B`
  const units = ["KB", "MB", "GB"]
  let value = bytes
  let unit = "B"
  for (const next of units) {
    if (value < 1024) break
    value /= 1024
    unit = next
  }
  const digits = value >= 100 ? 0 : value >= 10 ? 1 : 2
  return `${value.toFixed(digits)} ${unit}`
}

export function clampInt(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Math.round(value)))
}

/** Parses "WxH" strings like "4:3" into a ratio; null when malformed. */
export function parseAspectRatio(value: string): { w: number; h: number } | null {
  const match = /^\s*(\d{1,4})\s*:\s*(\d{1,4})\s*$/.exec(value)
  if (!match) return null
  const w = Number(match[1])
  const h = Number(match[2])
  if (!Number.isInteger(w) || !Number.isInteger(h) || w <= 0 || h <= 0) return null
  return { w, h }
}

/** Largest {w,h} with the target ratio that fits inside the bounds. */
export function fitToRatio(
  sourceWidth: number,
  sourceHeight: number,
  ratioW: number,
  ratioH: number
): { width: number; height: number } {
  const scaleW = sourceWidth / ratioW
  const scaleH = sourceHeight / ratioH
  const scale = Math.min(scaleW, scaleH)
  return {
    width: Math.max(1, Math.floor(ratioW * scale)),
    height: Math.max(1, Math.floor(ratioH * scale)),
  }
}
