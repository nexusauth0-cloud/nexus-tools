import { detectImageFormat } from "./format"
import { INPUT_FORMATS, MAX_IMAGE_FILE_BYTES, type ImageFormat } from "./types"

export type ImageValidationResult =
  | { ok: true; format: ImageFormat }
  | { ok: false; reason: "invalid-file" | "unsupported-format" | "too-large"; message: string }

/**
 * Gate every file the image tools accept.
 *
 * Format is decided purely by the file's real bytes — never by the
 * extension or the browser-provided MIME type. Oversize inputs are
 * rejected with a fixed constant so every tool is consistent.
 */
export function validateImageBytes(
  bytes: Uint8Array,
  maxBytes: number = MAX_IMAGE_FILE_BYTES
): ImageValidationResult {
  if (bytes.length > maxBytes) {
    return {
      ok: false,
      reason: "too-large",
      message: `The file is too large. The maximum supported size is ${(maxBytes / (1024 * 1024)).toFixed(0)} MB.`,
    }
  }

  if (bytes.length < 4 || (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] !== 0xff)) {
    return { ok: false, reason: "invalid-file", message: "This doesn't look like an image file." }
  }

  const format = detectImageFormat(bytes)
  if (!format) {
    return { ok: false, reason: "invalid-file", message: "This doesn't look like an image file." }
  }

  if (!INPUT_FORMATS.includes(format)) {
    return {
      ok: false,
      reason: "unsupported-format",
      message: `The ${format.toUpperCase()} format isn't supported by these tools.`,
    }
  }

  return { ok: true, format }
}
