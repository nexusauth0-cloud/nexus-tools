import { describe, expect, it } from "vitest"
import { checksumHex, bytesToHex, createChecksumHasher, digestHex } from "@/lib/checksum"
import { fileChecksumEngine } from "./engine"

/** ASCII helper: build a Uint8Array from a string. */
function bytesOf(text: string): Uint8Array {
  return new TextEncoder().encode(text)
}

describe("checksum library — known NIST/FIPS vectors", () => {
  it("sha256 of empty input", () => {
    expect(checksumHex(new Uint8Array(0), "sha256")).toBe(
      "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
    )
  })

  it("sha256 of 'abc'", () => {
    expect(checksumHex(bytesOf("abc"), "sha256")).toBe(
      "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad"
    )
  })

  it("sha384 of 'abc'", () => {
    expect(checksumHex(bytesOf("abc"), "sha384")).toBe(
      "cb00753f45a35e8bb5a03d699ac65007272c32ab0eded1631a8b605a43ff5bed8086072ba1e7cc2358baeca134c825a7"
    )
  })

  it("sha512 of 'abc'", () => {
    expect(checksumHex(bytesOf("abc"), "sha512")).toBe(
      "ddaf35a193617abacc417349ae20413112e6fa4e89a97ea20a9eeee64b55d39a2192992a274fc1a836ba3c23a3feebbd454d4423643ce80e2a9ac94fa54ca49f"
    )
  })

  it("sha1 of 'abc'", () => {
    expect(checksumHex(bytesOf("abc"), "sha1")).toBe("a9993e364706816aba3e25717850c26c9cd0d89d")
  })

  it("streaming hasher produces identical results to one-shot", () => {
    const oneShot = checksumHex(bytesOf("The quick brown fox jumps over the lazy dog"), "sha256")
    const hasher = createChecksumHasher("sha256")
    for (const chunk of ["The quick ", "brown fox ", "jumps over ", "the lazy dog"]) {
      hasher.update(bytesOf(chunk))
    }
    expect(bytesToHex(hasher.digest())).toBe(oneShot)
    expect(bytesToHex(createChecksumHasher("sha256").digest())).toBe(
      "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
    )
    expect(digestHex(createChecksumHasher("sha384"))).toHaveLength(96)
  })

  it("binary data (every byte value) hashes deterministically", () => {
    const binary = new Uint8Array(256).map((_, index) => index)
    expect(checksumHex(binary, "sha256")).toBe(checksumHex(binary.slice(), "sha256"))
    expect(checksumHex(binary, "sha256")).toMatch(/^[0-9a-f]{64}$/)
  })
})

describe("fileChecksumEngine", () => {
  it("computes sha256 and records size + no warning", async () => {
    const bytes = bytesOf("hello world")
    const result = await fileChecksumEngine.run({
      bytes,
      bytesLength: bytes.length,
      algorithm: "sha256",
    })
    expect(result.output.hex).toBe(
      "b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9"
    )
    expect(result.output.size).toBe(11)
    expect(result.output.warning).toBeUndefined()
  })

  it("adds the legacy warning for sha1", async () => {
    const bytes = bytesOf("legacy check")
    const result = await fileChecksumEngine.run({
      bytes,
      bytesLength: bytes.length,
      algorithm: "sha1",
    })
    expect(result.output.warning).toContain("SHA-1")
    expect(result.output.hex).toHaveLength(40)
  })

  it("validates the algorithm enum", async () => {
    await expect(
      fileChecksumEngine.run({
        bytes: bytesOf("x"),
        bytesLength: 1,
        algorithm: "md5",
      })
    ).rejects.toMatchObject({ code: "VALIDATION" })
  })

  it("rejects oversized files with a friendly error", async () => {
    await expect(
      fileChecksumEngine.run({
        bytes: new Uint8Array(0),
        bytesLength: 300 * 1024 * 1024,
        algorithm: "sha256",
      })
    ).rejects.toMatchObject({ code: "FILE_TOO_LARGE" })
  })
})
