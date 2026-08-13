import { describe, expect, it } from "vitest"
import { HELP_ARTWORK } from "./generated/help-artwork"

describe("HELP_ARTWORK snapshot", () => {
  it("exposes a non-empty plain record of decorations", () => {
    expect(HELP_ARTWORK).toBeTypeOf("object")
    expect(Object.keys(HELP_ARTWORK).length).toBeGreaterThan(0)
  })

  it("every decoration is a non-empty printable string", () => {
    for (const [id, art] of Object.entries(HELP_ARTWORK)) {
      expect(art.length, `decoration for "${id}" must not be empty`).toBeGreaterThan(0)
      expect(art, `decoration for "${id}" must be plain text`).not.toContain("\u0000")
    }
  })

  it("known tools have artwork (json seeded)", () => {
    expect(HELP_ARTWORK["json"]).toBeDefined()
    expect(HELP_ARTWORK["json"]).toContain("JSON")
  })
})
