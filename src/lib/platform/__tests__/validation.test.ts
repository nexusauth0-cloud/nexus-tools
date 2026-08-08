import { describe, expect, it } from "vitest"
import { validateManifest, validateRegistry } from "../validation"
import { fixtureTools, makeTool } from "./fixtures"

describe("validateManifest", () => {
  it("accepts a valid manifest", () => {
    const result = validateManifest(makeTool({ slug: "ok-tool" }))
    expect(result.ok).toBe(true)
    expect(result.errors).toEqual([])
  })

  it("rejects an unknown category id", () => {
    const result = validateManifest(makeTool({ slug: "bad-slug", categoryId: "nope" }))
    expect(result.ok).toBe(false)
    expect(result.errors.some((error) => error.includes("category"))).toBe(true)
  })

  it("rejects a bad slug", () => {
    const result = validateManifest({
      ...makeTool({ slug: "bad-tool" }),
      slug: "Bad Tool!",
    } as unknown as ReturnType<typeof makeTool>)
    expect(result.ok).toBe(false)
  })
})

describe("validateRegistry", () => {
  it("accepts a clean registry", () => {
    expect(validateRegistry(fixtureTools).ok).toBe(true)
  })

  it("flags duplicate slugs", () => {
    const result = validateRegistry([...fixtureTools, fixtureTools[0]])
    expect(result.ok).toBe(false)
    expect(result.errors.some((error) => error.includes("duplicate"))).toBe(true)
  })

  it("flags dangling related references", () => {
    const tools = [...fixtureTools, makeTool({ slug: "lonely-tool", related: ["does-not-exist"] })]
    const result = validateRegistry(tools)
    expect(result.ok).toBe(false)
    expect(result.errors.some((error) => error.includes("related"))).toBe(true)
  })
})
