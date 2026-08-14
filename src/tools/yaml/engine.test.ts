import { describe, expect, it } from "vitest"
import { yamlEngine } from "./engine"

describe("yamlEngine", () => {
  it("converts YAML to JSON", async () => {
    const { output } = await yamlEngine.run({
      yaml: "name: nexus\nversion: 1\nitems: [a, b]\n",
      direction: "to-json",
    })
    expect(JSON.parse(output.text)).toEqual({ name: "nexus", version: 1, items: ["a", "b"] })
    expect(output.shape).toBe("3 keys, 1 item")
  })

  it("converts JSON to YAML and back (round trip)", async () => {
    const first = await yamlEngine.run({
      yaml: '{"name":"nexus","enabled":true,"versions":[1,2]}',
      direction: "to-yaml",
    })
    expect(first.output.text).toContain("name: nexus")
    expect(first.output.text).toContain("enabled: true")
    const back = await yamlEngine.run({ yaml: first.output.text, direction: "to-json" })
    expect(JSON.parse(back.output.text)).toEqual({
      name: "nexus",
      enabled: true,
      versions: [1, 2],
    })
  })

  it("keeps non-finite literals instead of null", async () => {
    const { output } = await yamlEngine.run({ yaml: "a: .inf\nb: .nan\n", direction: "to-json" })
    expect(JSON.parse(output.text)).toEqual({ a: "Infinity", b: "NaN" })
  })

  it("applies YAML 1.2 core semantics (yes/no stay strings)", async () => {
    const { output } = await yamlEngine.run({ yaml: "a: yes\nb: no\n", direction: "to-json" })
    expect(JSON.parse(output.text)).toEqual({ a: "yes", b: "no" })
  })

  it("rejects executable tags", async () => {
    const error = await yamlEngine
      .run({ yaml: 'a: !!js/function "f() {}"\n', direction: "to-json" })
      .catch((e: unknown) => e)
    expect(error).toMatchObject({ code: "VALIDATION" })
  })

  it("rejects multiple documents", async () => {
    const error = await yamlEngine
      .run({ yaml: "a: 1\n---\nb: 2\n", direction: "to-json" })
      .catch((e: unknown) => e)
    expect(error).toMatchObject({ code: "VALIDATION" })
    expect((error as { toUserMessage(): string }).toUserMessage()).toContain("single document")
  })

  it("rejects invalid JSON in to-yaml mode with line/column", async () => {
    const error = await yamlEngine
      .run({ yaml: '{\n  "a": }', direction: "to-yaml" })
      .catch((e: unknown) => e)
    expect(error).toMatchObject({ code: "VALIDATION" })
  })

  it("applies the default direction (to-json)", async () => {
    const { output } = await yamlEngine.run({ yaml: "a: 1\n" })
    expect(output.direction).toBe("to-json")
    expect(JSON.parse(output.text)).toEqual({ a: 1 })
  })
})
