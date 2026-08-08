import { describe, expect, it } from "vitest"
import { ToolExecutionError } from "@/lib/tool-engine"
import { randomUUIDV4, uuidGeneratorEngine } from "./engine"

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
const UPPERCASE_REGEX = /^[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/

describe("randomUUIDV4", () => {
  it("produces well-formed RFC 4122 v4 UUIDs", () => {
    expect(randomUUIDV4()).toMatch(UUID_REGEX)
  })

  it("produces unique values", () => {
    const set = new Set(Array.from({ length: 1000 }, () => randomUUIDV4()))
    expect(set.size).toBe(1000)
  })
})

describe("uuidGeneratorEngine", () => {
  it("generates one UUID by default", async () => {
    const result = await uuidGeneratorEngine.run({ count: 1 })
    expect(result.output.count).toBe(1)
    expect(result.output.items[0]).toMatch(UUID_REGEX)
  })

  it("generates up to a requested batch", async () => {
    const result = await uuidGeneratorEngine.run({ count: 5 })
    expect(result.output.items).toHaveLength(5)
    expect(result.output.text.split("\n")).toHaveLength(5)
  })

  it("supports hyphen/uppercase formatting", async () => {
    const compact = await uuidGeneratorEngine.run({ count: 1, hyphens: false })
    expect(compact.output.items[0]).not.toContain("-")
    expect(compact.output.items[0]).toMatch(/^[0-9a-f]{32}$/)

    const upper = await uuidGeneratorEngine.run({ count: 1, uppercase: true })
    expect(upper.output.items[0]).toMatch(UPPERCASE_REGEX)
  })

  it("rejects counts above 100", async () => {
    const error = await uuidGeneratorEngine.run({ count: 101 }).catch((e: unknown) => e)
    expect(error).toBeInstanceOf(ToolExecutionError)
    expect((error as ToolExecutionError).code).toBe("VALIDATION")
  })

  it("rejects non-integer counts", async () => {
    const error = await uuidGeneratorEngine.run({ count: 2.5 }).catch((e: unknown) => e)
    expect(error).toBeInstanceOf(ToolExecutionError)
  })
})
