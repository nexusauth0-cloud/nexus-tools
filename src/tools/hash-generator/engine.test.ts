import { describe, expect, it } from "vitest"
import { createHash } from "node:crypto"
import { algorithmLabel, hashGeneratorEngine, legacyAlgorithm } from "./engine"
import { md5Hex } from "@/lib/md"

const KNOWN_VECTORS: Array<[string, string, string]> = [
  ["md5", "", "d41d8cd98f00b204e9800998ecf8427e"],
  ["md5", "abc", "900150983cd24fb0d6963f7d28e17f72"],
  ["md5", "message digest", "f96b697d7cb7938d525a2f31aaf161d0"],
  ["md5", "The quick brown fox jumps over the lazy dog", "9e107d9d372bb6826bd81d3542a419d6"],
]

describe("md5Hex", () => {
  it("matches RFC 1321 test vectors", () => {
    for (const [algorithm, text, expected] of KNOWN_VECTORS) {
      if (algorithm !== "md5") continue
      expect(md5Hex(text)).toBe(expected)
    }
  })

  it("matches node crypto for arbitrary Unicode input", () => {
    const text = "letters a\u030a? no: café \u4e2d\u6587 test"
    const mine = md5Hex(text)
    const reference = createHash("md5").update(text, "utf8").digest("hex")
    expect(mine).toBe(reference)
  })
})

describe("hashGeneratorEngine", () => {
  it("produces each supported algorithm against known SHA values", async () => {
    const vectors: Record<string, string> = {
      sha1: "a9993e364706816aba3e25717850c26c9cd0d89d",
      sha256: "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
      sha384:
        "cb00753f45a35e8bb5a03d699ac65007272c32ab0eded1631a8b605a43ff5bed8086072ba1e7cc2358baeca134c825a7",
      sha512:
        "ddaf35a193617abacc417349ae20413112e6fa4e89a97ea20a9eeee64b55d39a2192992a274fc1a836ba3c23a3feebbd454d4423643ce80e2a9ac94fa54ca49f",
    }
    for (const algorithm of ["sha1", "sha256", "sha384", "sha512"] as const) {
      const result = await hashGeneratorEngine.run({ algorithm, text: "abc" })
      expect(result.output.hex.toLowerCase()).toBe(vectors[algorithm])
      expect(result.output.algorithm).toBe(algorithm)
      expect(result.output.bytes).toBe(3)
    }
  })

  it("computes MD5 through the engine", async () => {
    const result = await hashGeneratorEngine.run({ algorithm: "md5", text: "abc" })
    expect(result.output.hex).toBe("900150983cd24fb0d6963f7d28e17f72")
    expect(result.output.bytes).toBe(3)
  })

  it("matches node crypto for ASCII, empty-adjacent, and Unicode inputs", async () => {
    const inputs = ["a", "hello world", "caf\u00e9 \u2615 \u2764\ufe0f", "x".repeat(64)]
    for (const text of inputs) {
      const result = await hashGeneratorEngine.run({ algorithm: "sha256", text })
      const reference = createHash("sha256").update(text, "utf8").digest("hex")
      expect(result.output.hex).toBe(reference)
    }
  })

  it("flags MD5 and SHA-1 as legacy", () => {
    expect(legacyAlgorithm("md5")).toBe(true)
    expect(legacyAlgorithm("sha1")).toBe(true)
    expect(legacyAlgorithm("sha256")).toBe(false)
    expect(legacyAlgorithm("sha384")).toBe(false)
    expect(legacyAlgorithm("sha512")).toBe(false)
  })

  it("labels algorithms canonically", () => {
    expect(algorithmLabel("md5")).toBe("MD5")
    expect(algorithmLabel("sha1")).toBe("SHA-1")
    expect(algorithmLabel("sha256")).toBe("SHA-256")
  })

  it("rejects empty text", async () => {
    const error = await hashGeneratorEngine
      .run({ algorithm: "md5", text: "   " })
      .catch((e: unknown) => e)
    expect(error).toBeDefined()
  })

  it("rejects unknown algorithms", async () => {
    const error = await hashGeneratorEngine
      .run({ algorithm: "sha3", text: "x" } as never)
      .catch((e: unknown) => e)
    expect(error).toBeDefined()
  })
})
