import { describe, expect, it } from "vitest"
import { runTool } from "@/lib/engine/engine"
import { getRuntimeLoader } from "@/lib/tools"

describe("json tool (registry → engine)", () => {
  it("formats", async () => {
    const r = await runTool("json", { input: '{"b":1,"a":[1,2]}' })
    expect(r.ok).toBe(true)
    expect(r.output).toBe('{\n  "b": 1,\n  "a": [\n    1,\n    2\n  ]\n}')
  })
  it("minifies and validates", async () => {
    const min = await runTool("json", { input: '{\n  "a": 1\n}', params: { mode: "minify" } })
    expect(min.output).toBe('{"a":1}')
    const valid = await runTool("json", {
      input: '{"a":[1,2],"b":null}',
      params: { mode: "validate" },
    })
    expect(valid.output).toMatch(/1 object, 1 array, 2 numbers, 1 null/)
  })
  it("reports errors with line/column", async () => {
    const r = await runTool("json", { input: '{\n  "a": }\n}' })
    expect(r.ok).toBe(false)
    expect(r.error?.message).toMatch(/^Invalid JSON:/)
    expect(r.error?.line).toBe(2)
  })
})

describe("yaml tool", () => {
  it("converts YAML to JSON", async () => {
    const r = await runTool("yaml", { input: "name: nexus\nversion: 1\nitems: [a, b]\n" })
    expect(r.ok).toBe(true)
    expect(JSON.parse(r.output)).toEqual({ name: "nexus", version: 1, items: ["a", "b"] })
  })

  it("converts JSON to YAML and back (round trip)", async () => {
    const r = await runTool("yaml", {
      input: '{"name":"nexus","enabled":true,"versions":[1,2]}',
      params: { direction: "to-yaml" },
    })
    expect(r.ok).toBe(true)
    expect(r.output).toContain("name: nexus")
    expect(r.output).toContain("enabled: true")
    const back = await runTool("yaml", { input: r.output })
    expect(back.ok).toBe(true)
    expect(JSON.parse(back.output)).toEqual({ name: "nexus", enabled: true, versions: [1, 2] })
  })

  it("keeps non-finite literals instead of null", async () => {
    const r = await runTool("yaml", { input: "a: .inf\nb: .nan\n" })
    expect(r.ok).toBe(true)
    expect(JSON.parse(r.output)).toEqual({ a: "Infinity", b: "NaN" })
  })

  it("rejects executable tags", async () => {
    const r = await runTool("yaml", { input: 'a: !!js/function "f() {}"\n' })
    expect(r.ok).toBe(false)
  })
})

describe("csv tool", () => {
  it("converts CSV to an array of objects", async () => {
    const r = await runTool("csv", { input: "name,votes\nAlice,3\nBob,5\n" })
    expect(r.ok).toBe(true)
    expect(JSON.parse(r.output)).toEqual([
      { name: "Alice", votes: "3" },
      { name: "Bob", votes: "5" },
    ])
    expect(r.blocks?.length).toBe(1)
    expect(r.info?.rows).toBe("2")
  })

  it("rejects ragged rows with a helpful message", async () => {
    const r = await runTool("csv", { input: "a,b\n1\n" })
    expect(r.ok).toBe(false)
    expect(r.error?.message).toMatch(/row 2 has 1 fields/)
  })
})

describe("color tool", () => {
  it("converts hex to rgb/hsl", async () => {
    const r = await runTool("color", { input: "#ff8800" })
    expect(r.ok).toBe(true)
    expect(r.output).toBe("#FF8800")
    expect(r.blocks?.map((b) => b.text)).toEqual([
      "#FF8800",
      "rgb(255, 136, 0)",
      "hsl(32, 100%, 50%)",
    ])
  })

  it("forces hsl output with the mode param", async () => {
    const r = await runTool("color", { input: "rgb(255, 0, 0)", params: { mode: "to-hsl" } })
    expect(r.ok).toBe(true)
    expect(r.output).toBe("hsl(0, 100%, 50%)")
  })

  it("rejects garbage input", async () => {
    const r = await runTool("color", { input: "not a color" })
    expect(r.ok).toBe(false)
  })
})

describe("radix tool", () => {
  it("reads hex by letters", async () => {
    const r = await runTool("radix", { input: "ff" })
    expect(r.ok).toBe(true)
    expect(r.output).toBe("ff (hex)")
    expect(r.info?.decimal).toBe("255")
    expect(r.blocks?.[2]!.text).toBe("255")
  })

  it("reads decimal bare digits", async () => {
    const r = await runTool("radix", { input: "255" })
    expect(r.ok).toBe(true)
    expect(r.info?.decimal).toBe("255")
    expect(r.blocks?.[3]!.text).toBe("ff")
  })

  it("honors 0b prefix", async () => {
    const r = await runTool("radix", { input: "0b1010" })
    expect(r.ok).toBe(true)
    expect(r.info?.decimal).toBe("10")
  })
})

describe("workspace loader path (runWiredTool)", () => {
  it("runs each tool through its dynamic loader", async () => {
    for (const [id, input] of [
      ["json", '{"a":1}'],
      ["yaml", "a: 1\n"],
      ["csv", "a\n1\n"],
      ["color", "#fff"],
      ["radix", "abc"],
    ] as const) {
      const entry = (await import("@/lib/registry")).getStaticTool(id)
      const loader = getRuntimeLoader(entry!.entryPoint)!
      const { runWiredTool } = await import("@/lib/engine/engine")
      const outcome = await runWiredTool(loader, { input })
      expect(outcome.ok, `${id} should succeed`).toBe(true)
    }
  })
})
