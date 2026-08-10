import { sha1 } from "@noble/hashes/legacy.js"
import { sha256, sha384, sha512 } from "@noble/hashes/sha2.js"

/**
 * Dependency rationale (documented here for the record):
 *
 * `@noble/hashes` (MIT, zero dependencies, pure TypeScript, tree-
 * shakeable, ~10 KB used) is the chosen hash provider. Native Web
 * Crypto (`crypto.subtle.digest`) is one-shot only — it cannot hash a
 * large file incrementally without first buffering the whole thing.
 * noble's streaming `hash.create()` API lets the checksum tool digest
 * files chunk-by-chunk so big files never block the browser for long.
 * It runs identically in Node (tests) and the browser, which makes the
 * known-vector tests deterministic.
 */

export const CHECKSUM_ALGORITHMS = ["sha256", "sha384", "sha512", "sha1"] as const
export type ChecksumAlgorithm = (typeof CHECKSUM_ALGORITHMS)[number]

export const MAX_CHECKSUM_FILE_BYTES = 256 * 1024 * 1024

/** SHA-1 is legacy: tools should surface this alongside the digest. */
export const SHA1_LEGACY_WARNING =
  "SHA-1 is a legacy algorithm and is no longer considered secure for integrity checks against malicious tampering."

type SharedHasher = { update(data: Uint8Array): void; digest(): Uint8Array }

const FACTORIES: Record<ChecksumAlgorithm, () => SharedHasher> = {
  sha256: () => sha256.create(),
  sha384: () => sha384.create(),
  sha512: () => sha512.create(),
  sha1: () => sha1.create(),
}

export function checksumHex(data: Uint8Array, algorithm: ChecksumAlgorithm): string {
  const hasher = FACTORIES[algorithm]()
  hasher.update(data)
  return bytesToHex(hasher.digest())
}

/** Streaming variant: update the same hasher across chunks. */
export function createChecksumHasher(algorithm: ChecksumAlgorithm): SharedHasher {
  return FACTORIES[algorithm]()
}

export function digestHex(hasher: SharedHasher): string {
  return bytesToHex(hasher.digest())
}

export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("")
}
