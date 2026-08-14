import { describe, expect, it } from "vitest"
import { csvEngine } from "./engine"

describe("csvEngine", () => {
  it("converts CSV to an array of objects", async () => {
    const { output } = await csvEngine.run({ csv: "name,votes\nAlice,3\nBob,5\n" })
    expect(JSON.parse(output.text)).toEqual([
      { name: "Alice", votes: "3" },
      { name: "Bob", votes: "5" },
    ])
    expect(output.rows).toBe(2)
    expect(output.columns).toBe(2)
    expect(output.numericColumn).toBe("votes")
  })

  it("emits a single object for one-row files", async () => {
    const { output } = await csvEngine.run({ csv: "name,age\nAda,36\n" })
    expect(JSON.parse(output.text)).toEqual({ name: "Ada", age: "36" })
  })

  it("handles quoted fields with commas and escaped quotes", async () => {
    const { output } = await csvEngine.run({
      csv: 'city,comment\n"New York","said ""hi"", then left"\n',
    })
    expect(JSON.parse(output.text)).toEqual({
      city: "New York",
      comment: 'said "hi", then left',
    })
  })

  it("builds a preview of the header and first rows", async () => {
    const { output } = await csvEngine.run({ csv: "a,b\n1,2\n3,4\n" })
    expect(output.preview).toBe("a, b\n1, 2\n3, 4")
  })

  it("rejects ragged rows with a helpful message", async () => {
    const error = await csvEngine.run({ csv: "a,b\n1\n" }).catch((e: unknown) => e)
    expect(error).toMatchObject({ code: "VALIDATION" })
    expect((error as { toUserMessage(): string }).toUserMessage()).toMatch(/row 2 has 1 fields/)
  })

  it("rejects missing header input", async () => {
    const error = await csvEngine.run({ csv: "" }).catch((e: unknown) => e)
    expect(error).toMatchObject({ code: "VALIDATION" })
  })
})
