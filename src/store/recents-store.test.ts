import { beforeEach, describe, expect, it } from "vitest"
import { migrateRecents, useRecentsStore } from "./recents-store"

describe("recents store", () => {
  beforeEach(() => {
    useRecentsStore.setState({ recents: [] })
  })

  it("prepends new tools newest-first", () => {
    useRecentsStore.getState().push("json-formatter")
    useRecentsStore.getState().push("uuid-generator")
    expect(useRecentsStore.getState().recents.map((entry) => entry.slug)).toEqual([
      "uuid-generator",
      "json-formatter",
    ])
  })

  it("re-orders a revisited tool to the front without duplicating", () => {
    useRecentsStore.getState().push("a")
    useRecentsStore.getState().push("b")
    useRecentsStore.getState().push("a")
    expect(useRecentsStore.getState().recents.map((entry) => entry.slug)).toEqual(["a", "b"])
    expect(useRecentsStore.getState().recents).toHaveLength(2)
  })

  it("records a timestamp per visit and never stores payloads", () => {
    useRecentsStore.getState().push("jwt-generator")
    const entry = useRecentsStore.getState().recents[0]
    expect(entry.slug).toBe("jwt-generator")
    expect(entry.at).toBeTypeOf("number")
    expect(entry).toEqual({ slug: "jwt-generator", at: entry.at })
  })

  it("caps the list at 8 entries", () => {
    for (let index = 0; index < 12; index += 1) {
      useRecentsStore.getState().push(`tool-${index}`)
    }
    expect(useRecentsStore.getState().recents).toHaveLength(8)
  })

  it("clears all recents", () => {
    useRecentsStore.getState().push("a")
    useRecentsStore.getState().clear()
    expect(useRecentsStore.getState().recents).toEqual([])
  })

  it("migrates the legacy bare-slug storage shape", () => {
    const migrated = migrateRecents(["qr-generator", "jsonpath"]) as {
      recents: { slug: string; at: number }[]
    }
    expect(migrated.recents).toHaveLength(2)
    expect(migrated.recents[0].slug).toBe("qr-generator")
    expect(migrated.recents[0].at).toBeTypeOf("number")
  })

  it("migrates the legacy { recents: string[] } storage shape", () => {
    const migrated = migrateRecents({ recents: ["epoch-converter", "regex-tester"] }) as {
      recents: { slug: string; at: number }[]
    }
    expect(migrated.recents).toHaveLength(2)
    expect(migrated.recents[1].slug).toBe("regex-tester")
    expect(migrated.recents[1].at).toBeTypeOf("number")
  })

  it("leaves an empty legacy array untouched", () => {
    expect(migrateRecents({ recents: [] })).toEqual({ recents: [] })
  })

  it("leaves the current shape untouched by migration", () => {
    const current = [{ slug: "a", at: 123 }]
    expect(migrateRecents(current)).toBe(current)
  })
})
