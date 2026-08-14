import { describe, expect, it } from "vitest"
import { radixEngine } from "./engine"

describe("radixEngine", () => {
  it("reads hex by letters", async () => {
    const { output } = await radixEngine.run({ number: "ff" })
    expect(output.text).toBe("ff (hex)")
    expect(output.decimal).toBe("255")
    expect(output.reason).toBe("read by its letters (hex)")
    expect(output.blocks[0]!.text).toBe("11111111")
    expect(output.blocks[2]!.text).toBe("255")
    expect(output.blocks[3]!.text).toBe("ff")
  })

  it("reads decimal bare digits", async () => {
    const { output } = await radixEngine.run({ number: "255" })
    expect(output.decimal).toBe("255")
    expect(output.reason).toBe("read as decimal")
    expect(output.blocks[3]!.text).toBe("ff")
  })

  it("honors the 0b prefix", async () => {
    const { output } = await radixEngine.run({ number: "0b1010" })
    expect(output.decimal).toBe("10")
    expect(output.reason).toBe("0b prefix")
  })

  it("honors the 0x prefix", async () => {
    const { output } = await radixEngine.run({ number: "0x1f" })
    expect(output.decimal).toBe("31")
    expect(output.reason).toBe("0x prefix")
  })

  it("reads base-36 letters correctly", async () => {
    const { output } = await radixEngine.run({ number: "zz" })
    expect(output.decimal).toBe("1295")
  })

  it("includes every base 2–36 in the full table", async () => {
    const { output } = await radixEngine.run({ number: "255" })
    const table = output.blocks[4]!
    expect(table.label).toBe("All bases 2–36")
    expect(table.text).toContain(" 2: ")
    expect(table.text).toContain("16: ff")
    expect(table.text).toContain("36: 73")
  })

  it("rejects values above the max safe integer", async () => {
    const error = await radixEngine
      .run({ number: "99999999999999999999999999" })
      .catch((e: unknown) => e)
    expect(error).toMatchObject({ code: "VALIDATION" })
  })

  it("rejects empty input", async () => {
    const error = await radixEngine.run({ number: "  " }).catch((e: unknown) => e)
    expect(error).toMatchObject({ code: "VALIDATION" })
  })
})
