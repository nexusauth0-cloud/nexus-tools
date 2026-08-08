import { ToolExecutionError } from "@/lib/tool-engine"
import {
  readImageDimensions,
  validateImageBytes,
  MAX_IMAGE_FILE_BYTES,
  type ImageFormat,
} from "./index"

export type SupportedInputFormat = Exclude<ImageFormat, "avif">

/**
 * Shared source gates for image engines. Both helpers validate the raw
 * bytes (magic bytes + size cap) and throw the engine's error shape so
 * the UI surfaces a single consistent message. Nothing here trusts the
 * file extension or the browser-provided MIME type.
 */

function throwForValidation(
  validation: Extract<ReturnType<typeof validateImageBytes>, { ok: false }>
): never {
  if (validation.reason === "too-large") {
    throw new ToolExecutionError("FILE_TOO_LARGE", validation.message)
  }
  throw new ToolExecutionError("VALIDATION", validation.message, [
    { field: "file", message: validation.message },
  ])
}

/** Validates bytes and returns the detected format; throws on rejection. */
export function requireValidImageBytes(
  bytes: Uint8Array,
  maxBytes: number = MAX_IMAGE_FILE_BYTES
): SupportedInputFormat {
  const validation = validateImageBytes(bytes, maxBytes)
  if (!validation.ok) throwForValidation(validation)
  return validation.format as SupportedInputFormat
}

/** Validates and returns format + dimensions; throws when unknown. */
export function probeImageSource(
  bytes: Uint8Array,
  maxBytes: number = MAX_IMAGE_FILE_BYTES
): { format: SupportedInputFormat; width: number; height: number } {
  requireValidImageBytes(bytes, maxBytes)
  const dims = readImageDimensions(bytes)
  if (!dims) {
    throw new ToolExecutionError(
      "PROCESSING",
      "The file isn't a valid image: its dimensions couldn't be read."
    )
  }
  return { format: dims.format as SupportedInputFormat, width: dims.width, height: dims.height }
}
