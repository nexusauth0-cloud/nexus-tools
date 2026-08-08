"use client"

import { IMAGE_FORMAT_INFO, type ImageFormat } from "./types"

/**
 * Browser-only image processing helpers.
 *
 * This module must never be imported from Node-side code (tests run with
 * the "node" environment). Everything here uses canvas / ImageBitmap APIs
 * to decode and re-encode pixels; the pure geometry lives in ./plan and
 * ./format so engines stay testable.
 */

export interface DecodedImage {
  /** ImageBitmap when the browser provides it, else an HTMLImageElement. */
  source: ImageBitmap | HTMLImageElement
  width: number
  height: number
  close: () => void
}

/** Decodes a File into a reusable bitmap. Resolves with an error-reason on failure. */
export async function decodeImageFile(file: File): Promise<DecodedImage> {
  const bitmapSource = "createImageBitmap" in globalThis
  if (bitmapSource) {
    try {
      const bitmap = await createImageBitmap(file)
      return {
        source: bitmap,
        width: bitmap.width,
        height: bitmap.height,
        close: () => bitmap.close(),
      }
    } catch {
      // Fall through to <img> decoding below.
    }
  }

  const url = URL.createObjectURL(file)
  try {
    const image = await loadHtmlImage(url)
    return {
      source: image,
      width: image.naturalWidth,
      height: image.naturalHeight,
      close: () => URL.revokeObjectURL(url),
    }
  } catch (error) {
    URL.revokeObjectURL(url)
    throw error
  }
}

function loadHtmlImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error("Unable to decode this image."))
    image.src = url
  })
}

export interface RenderCanvasLike {
  width: number
  height: number
  getContext(contextId: "2d"): CanvasRenderingContext2D | null
}

export type CanvasLike = HTMLCanvasElement | OffscreenCanvas

export function createCanvas(width: number, height: number): OffscreenCanvas | HTMLCanvasElement {
  if (typeof OffscreenCanvas !== "undefined") {
    return new OffscreenCanvas(width, height)
  }
  const canvas = document.createElement("canvas")
  canvas.width = width
  canvas.height = height
  return canvas
}

/**
 * Renders a crop region of the source with rotation + flips onto a new
 * canvas and encodes it to the requested format.
 */
export async function cropAndEncode(
  source: ImageBitmap | HTMLImageElement,
  region: { x: number; y: number; width: number; height: number },
  rotation: number,
  flipH: boolean,
  flipV: boolean,
  format: ImageFormat,
  quality?: number
): Promise<Blob> {
  const rotated = rotation % 2 === 1
  const canvas = createCanvas(
    rotated ? region.height : region.width,
    rotated ? region.width : region.height
  )
  const context = canvas.getContext("2d")
  if (!context) throw new Error("Canvas is not available in this browser.")

  context.translate(rotated ? region.height : region.width, 0)
  context.rotate(Math.PI / 2)
  if (flipH) context.scale(-1, 1)
  if (flipV) context.scale(1, -1)
  context.drawImage(
    source,
    region.x,
    region.y,
    region.width,
    region.height,
    0,
    0,
    region.width,
    region.height
  )

  return encodeCanvas(canvas, format, quality)
}

export function encodeCanvas(
  canvas: CanvasLike,
  format: ImageFormat,
  quality?: number
): Promise<Blob> {
  const { mime } = IMAGE_FORMAT_INFO[format]
  if (typeof OffscreenCanvas !== "undefined" && canvas instanceof OffscreenCanvas) {
    return canvas.convertToBlob({ type: mime, quality })
  }
  return new Promise((resolve, reject) => {
    ;(canvas as HTMLCanvasElement).toBlob(
      (blob) =>
        blob ? resolve(blob) : reject(new Error(`Encoding to ${format.toUpperCase()} failed.`)),
      mime,
      quality
    )
  })
}

/**
 * Feature-detects whether this browser can encode a format.
 * JPEG/PNG/WebP are universal; AVIF output is offered only when detected.
 */
export function canEncodeFormat(format: ImageFormat): boolean {
  if (format !== "avif") return true
  if (typeof document === "undefined") return false
  try {
    const canvas = document.createElement("canvas")
    canvas.width = 2
    canvas.height = 1
    const context = canvas.getContext("2d")
    if (!context) return false
    return canvas.toDataURL("image/avif").startsWith("data:image/avif")
  } catch {
    return false
  }
}
