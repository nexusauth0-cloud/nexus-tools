import { z } from "zod"
import { createToolEngine, summarize, ToolExecutionError } from "@/lib/tool-engine"
import {
  CHECKSUM_ALGORITHMS,
  checksumHex,
  MAX_CHECKSUM_FILE_BYTES,
  SHA1_LEGACY_WARNING,
  type ChecksumAlgorithm,
} from "@/lib/checksum"

/**
 * File Checksum engine.
 *
 * Digests arrive as raw bytes and are hashed incrementally with the
 * shared checksum library (no upload, no Web Crypto one-shot limits).
 * The digest itself is never stored in history — the summary only
 * records algorithm and size.
 */

const schema = z.object({
  bytes: z.instanceof(Uint8Array),
  bytesLength: z.number().int().nonnegative(),
  algorithm: z.enum(CHECKSUM_ALGORITHMS),
})

export interface ChecksumOutput {
  algorithm: ChecksumAlgorithm
  hex: string
  size: number
  /** Legacy warning when SHA-1 is chosen. */
  warning?: string
}

export const fileChecksumEngine = createToolEngine<typeof schema, ChecksumOutput>({
  toolId: "file-checksum",
  schema,
  process: ({ bytes, bytesLength, algorithm }) => {
    if (bytesLength > MAX_CHECKSUM_FILE_BYTES) {
      throw new ToolExecutionError(
        "FILE_TOO_LARGE",
        `This file is larger than the ${Math.round(MAX_CHECKSUM_FILE_BYTES / (1024 * 1024))} MB limit for checksums.`
      )
    }
    const hex = checksumHex(bytes, algorithm)
    return {
      algorithm,
      hex,
      size: bytesLength,
      ...(algorithm === "sha1" ? { warning: SHA1_LEGACY_WARNING } : {}),
    }
  },
  summarize: {
    input: (value) =>
      summarize(`${value.algorithm.toUpperCase()} for a ${fileSizeLabel(value.bytesLength)} file`),
    output: (value) =>
      summarize(
        `${value.algorithm.toUpperCase()} digest computed for ${fileSizeLabel(value.size)}`
      ),
  },
})

function fileSizeLabel(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
