/**
 * QR Reader input caps — enforced before any pixel data is handed to the
 * decoder, so oversized images fail fast with a clear error instead of
 * freezing the browser.
 */

/** Maximum image edge in pixels (images are decoded as square-ish but any aspect is capped per-axis). */
export const QR_MAX_IMAGE_PIXELS = 4096
/** Maximum uploaded file size in bytes (10 MB). */
export const QR_MAX_IMAGE_BYTES = 10 * 1024 * 1024
/** Accepted image MIME types (PNG / JPEG / WebP). */
export const QR_ACCEPTED_MIME_TYPES = ["image/png", "image/jpeg", "image/webp"] as const

export function isAcceptedImageMime(mime: string): boolean {
  return (QR_ACCEPTED_MIME_TYPES as readonly string[]).includes(mime)
}
