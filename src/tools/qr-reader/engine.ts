import { z } from "zod"
import { createToolEngine } from "@/lib/tool-engine"
import { decodeQrFromRgba, type QrDecodedContent } from "@/lib/qr"
import { QR_MAX_IMAGE_PIXELS, QR_MAX_IMAGE_BYTES } from "./limits"

/**
 * QR Code Reader engine.
 *
 * The browser extracts RGBA pixels from a locally chosen image (canvas) and
 * this engine decodes them with jsQR — the image never leaves the client.
 * Decoded content is untrusted: classification is heuristic, nothing is
 * auto-opened, and history stores only safe metadata (dimensions, format,
 * classification) — never the decoded value.
 */

const schema = z
  .object({
    width: z.number().int().min(1).max(QR_MAX_IMAGE_PIXELS),
    height: z.number().int().min(1).max(QR_MAX_IMAGE_PIXELS),
    /**
     * RGBA pixel data (4 bytes per pixel). Typed as a byte array and
     * length-checked once — validating ~67M elements individually would
     * stall the main thread for large images for no benefit (canvas pixel
     * buffers are always 0–255 integers).
     */
    data: z.custom<Uint8Array | Uint8ClampedArray>(
      (value) => value instanceof Uint8ClampedArray || value instanceof Uint8Array,
      "Pixel data must be a Uint8Array or Uint8ClampedArray."
    ),
    fileName: z.string().max(256).default("image"),
    fileSizeBytes: z.number().int().nonnegative().max(QR_MAX_IMAGE_BYTES).default(0),
    mime: z.string().max(64).default("image/png"),
  })
  .superRefine((value, ctx) => {
    if (value.data.length !== value.width * value.height * 4) {
      ctx.addIssue({
        code: "custom",
        path: ["data"],
        message: "Pixel data does not match the image dimensions.",
      })
    }
  })

export interface QrReaderOutput {
  ok: boolean
  content: QrDecodedContent | null
  format: string | null
  image: {
    width: number
    height: number
    fileSize: number
    fileName: string
    mime: string
  }
}

export const qrReaderEngine = createToolEngine<typeof schema, QrReaderOutput>({
  toolId: "qr-reader",
  schema,
  process: ({ width, height, data, fileName, fileSizeBytes, mime }) => {
    const decoded = decodeQrFromRgba({ data, width, height })
    return {
      ok: decoded.ok,
      content: decoded.content,
      format: decoded.format,
      image: { width, height, fileSize: fileSizeBytes, fileName, mime },
    }
  },
  summarize: {
    input: (value) => `Image ${value.fileName} (${value.width}×${value.height})`,
    output: (value) =>
      value.ok && value.content
        ? `QR: ${value.content.classification.type} detected (${value.content.characterCount} chars)`
        : "No QR code found in image",
  },
})
