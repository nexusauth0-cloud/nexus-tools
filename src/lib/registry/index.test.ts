import { describe, expect, it } from "vitest"
import { getStaticTool, listStaticTools, STATIC_TOOLS } from "./index"
import { runTool } from "@/lib/engine/engine"

describe("static registry wiring", () => {
  it("wires every declared tool to its implementation", () => {
    const json = getStaticTool("json")
    expect(json).toBeDefined()
    expect(json?.entryPoint).toBe("tools:json")
    expect(STATIC_TOOLS.length).toBeGreaterThan(0)
  })

  it("groups tools by category for the index pages", () => {
    const groups = listStaticTools()
    expect(groups.length).toBeGreaterThan(0)
    expect(groups.flatMap((g) => g.tools.map((t) => t.id))).toContain("json")
  })

  it("declarative content reaches the renderer", () => {
    const json = getStaticTool("json")
    expect(json?.decl?.description).toBeInstanceOf(Array)
    expect(json?.decl?.faq).toBeInstanceOf(Array)
    expect(json?.decl?.accent).toMatch(/^#[0-9a-f]{6}$/)
  })
})

describe("json tool end to end (registry → engine)", () => {
  it("formats JSON through runTool", async () => {
    const outcome = await runTool("json", { input: '{"b":1,"a":[1,2]}' })
    expect(outcome.ok).toBe(true)
    expect(outcome.output).toBe('{\n  "b": 1,\n  "a": [\n    1,\n    2\n  ]\n}')
  })

  it("minifies through params", async () => {
    const outcome = await runTool("json", { input: '{\n  "a": 1\n}', params: { mode: "minify" } })
    expect(outcome.ok).toBe(true)
    expect(outcome.output).toBe('{"a":1}')
  })

  it("validate mode summarizes the document", async () => {
    const outcome = await runTool("json", {
      input: '{"a":[1,2],"b":null}',
      params: { mode: "validate" },
    })
    expect(outcome.ok).toBe(true)
    expect(outcome.output).toMatch(/Valid JSON: 1 object, 1 array, 2 numbers, 1 null/)
  })

  it("binary mode escapes non-ASCII", async () => {
    const outcome = await runTool("json", { input: '{"s":"héllo"}', params: { mode: "binary" } })
    expect(outcome.ok).toBe(true)
    expect(outcome.output).toContain("\\u00e9")
  })

  it("reports parse errors with line/column", async () => {
    const outcome = await runTool("json", { input: '{\n  "a": 1,\n  "b": }\n}' })
    expect(outcome.ok).toBe(false)
    expect(outcome.error?.message).toMatch(/^Invalid JSON:/)
    expect(outcome.error?.line).toBe(3)
  })

  it("rejects blank input before running", async () => {
    const outcome = await runTool("json", { input: "   " })
    expect(outcome.ok).toBe(false)
    expect(outcome.error?.message).toMatch(/Enter some input/)
  })
})