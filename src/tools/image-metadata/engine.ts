import { z } from "zod"
import { createToolEngine, summarize } from "@/lib/tool-engine"
import { parseExif, readImageDimensions } from "@/lib/image"
import { requireValidImageBytes } from "@/lib/image/engine-source"

/**
 * Image Metadata / EXIF viewer.
 *
 * Reads metadata straight from the file's bytes — the EXIF parser is pure
 * and unit-tested. This tool *reads* metadata; it does not claim to remove
 * or scrub EXIF. GPS coordinates are surfaced in the UI but never stored
 * in analytics or history (only "has GPS" is recorded).
 */

const schema = z.object({
  bytes: z.instanceof(Uint8Array),
  bytesLength: z.number().int().nonnegative(),
})

export interface MetadataOutput {
  format: "jpeg" | "png" | "webp"
  width: number | null
  height: number | null
  bytes: number
  /** Exif block presence. */
  exif: boolean
  make?: string
  model?: string
  software?: string
  imageDescription?: string
  dateTime?: string
  dateTimeOriginal?: string
  orientation?: { id: number; label: string }
  exposure?: string
  fNumber?: number
  iso?: number
  focalLength?: number
  focalLength35mm?: number
  flash?: boolean
  lensMake?: string
  lensModel?: string
  /** Location presence. Raw coordinates are never kept in this record. */
  hasGps: boolean
  /** Number of EXIF fields found. */
  entryCount: number
}

export const imageMetadataEngine = createToolEngine<typeof schema, MetadataOutput>({
  toolId: "image-metadata",
  schema,
  process: ({ bytes, bytesLength }) => {
    const format = requireValidImageBytes(bytes)
    const dims = readImageDimensions(bytes)

    const raw = parseExif(bytes)

    const output: MetadataOutput = {
      format,
      width: dims?.width ?? null,
      height: dims?.height ?? null,
      bytes: bytesLength,
      exif: raw.found,
      hasGps: Boolean(raw.gps),
      orientation: raw.orientation,
      fNumber: raw.fNumber,
      iso: raw.iso,
      focalLength: raw.focalLength,
      focalLength35mm: raw.focalLength35mm,
      flash: raw.flash,
      exposure: raw.exposureTime,
      entryCount: raw.entryCount,
    }
    if (raw.make) output.make = raw.make
    if (raw.model) output.model = raw.model
    if (raw.software) output.software = raw.software
    if (raw.imageDescription) output.imageDescription = raw.imageDescription
    if (raw.dateTime) output.dateTime = raw.dateTime
    if (raw.dateTimeOriginal) output.dateTimeOriginal = raw.dateTimeOriginal
    if (raw.lensMake) output.lensMake = raw.lensMake
    if (raw.lensModel) output.lensModel = raw.lensModel

    return output
  },
  summarize: {
    input: (value) => summarize(`${value.bytesLength} byte image for inspection`),
    output: (value) =>
      summarize(
        `${value.format.toUpperCase()} file ${value.hasGps ? "with GPS data" : "without GPS"}`
      ),
  },
})
