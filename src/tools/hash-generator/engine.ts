import { z } from "zod"
import { createToolEngine, summarize, ToolExecutionError } from "@/lib/tool-engine"
import { byteSize } from "@/lib/json"
import { md5Hex } from "@/lib/md"

/**
 * Hash Generator engine — digests text with Web Crypto when available.
 *
 * SHA-1, SHA-256, SHA-384 and SHA-512 use `crypto.subtle.digest`. MD5 is
 * not offered by Web Crypto, so a small pure-JS implementation is used.
 * MD5 and SHA-1 are flagged legacy in the UI: they are broken for
 * security-critical use and must never be relied on for that purpose.
 */

export const HASH_ALGORITHMS = ["md5", "sha1", "sha256", "sha384", "sha512"] as const
export type HashAlgorithm = (typeof HASH_ALGORITHMS)[number]

/** Canonical label, e.g. "SHA-256". */
export function algorithmLabel(algorithm: HashAlgorithm): string {
  switch (algorithm) {
    case "md5":
      return "MD5"
    case "sha1":
      return "SHA-1"
    case "sha256":
      return "SHA-256"
    case "sha384":
      return "SHA-384"
    case "sha512":
      return "SHA-512"
  }
}

/** True for algorithms that must be labelled non-recommended. */
export function legacyAlgorithm(algorithm: HashAlgorithm): boolean {
  return algorithm === "md5" || algorithm === "sha1"
}

export interface HashResult {
  algorithm: HashAlgorithm
  hex: string
  bytes: number
}

const schema = z.object({
  algorithm: z.enum(HASH_ALGORITHMS),
  text: z.string().trim().min(1, "Enter text to hash.").max(10_000_000, "Input is too large."),
})

const WEB_CRYPTO_NAMES: Partial<Record<HashAlgorithm, string>> = {
  sha1: "SHA-1",
  sha256: "SHA-256",
  sha384: "SHA-384",
  sha512: "SHA-512",
}

function cryptoSubtle(): SubtleCrypto | null {
  if (typeof globalThis.crypto?.subtle === "undefined") return null
  return globalThis.crypto.subtle
}

function bufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer), (byte) => byte.toString(16).padStart(2, "0")).join("")
}

export const hashGeneratorEngine = createToolEngine<typeof schema, HashResult>({
  toolId: "hash-generator",
  schema,
  process: async ({ algorithm, text }) => {
    if (algorithm === "md5") {
      return { algorithm, hex: md5Hex(text), bytes: byteSize(text) }
    }

    const name = WEB_CRYPTO_NAMES[algorithm]
    const subtle = cryptoSubtle()
    if (!name || !subtle) {
      throw new ToolExecutionError(
        "NOT_SUPPORTED",
        `${algorithmLabel(algorithm)} is not supported by this browser.`
      )
    }

    const digest = await subtle.digest(name, new TextEncoder().encode(text))
    return { algorithm, hex: bufferToHex(digest), bytes: byteSize(text) }
  },
  summarize: {
    input: (value) => summarize(`${algorithmLabel(value.algorithm)} ${value.text}`),
    output: (value) => `${value.hex.slice(0, 12)}… (${algorithmLabel(value.algorithm)})`,
  },
})
