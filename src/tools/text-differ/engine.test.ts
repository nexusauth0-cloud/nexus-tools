import { describe, expect, it } from "vitest"
import { ToolExecutionError } from "@/lib/tool-engine"
import { textDiffEngine, TEXT_DIFF_MAX_CHARS } from "./engine"

describe("textDiffEngine", () => {
  it("reports identical texts as unchanged", async () => {
    const result = await textDiffEngine.run({ original: "a\nb\nc", modified: "a\nb\nc" })
    expect(result.output.diff.unchanged).toBe(3)
    expect(result.output.diff.added).toBe(0)
    expect(result.output.diff.removed).toBe(0)
    expect(result.output.diff.changed).toBe(0)
    expect(result.output.diff.ops.every((op) => op.type === "equal")).toBe(true)
  })

  it("detects pure additions", async () => {
    const result = await textDiffEngine.run({ original: "a", modified: "a\nb" })
    expect(result.output.diff.added).toBe(1)
    expect(result.output.diff.removed).toBe(0)
    expect(result.output.diff.ops).toContainEqual({ type: "insert", line: "b" })
  })

  it("detects pure removals", async () => {
    const result = await textDiffEngine.run({ original: "a\nb", modified: "a" })
    expect(result.output.diff.removed).toBe(1)
    expect(result.output.diff.added).toBe(0)
  })

  it("reports modified lines as remove+insert pairs", async () => {
    const result = await textDiffEngine.run({ original: "a\nold\nb", modified: "a\nnew\nb" })
    expect(result.output.diff.removed).toBe(1)
    expect(result.output.diff.added).toBe(1)
    expect(result.output.diff.modifiedBlocks).toBe(1)
  })

  it("treats empty sides correctly", async () => {
    const emptyToContent = await textDiffEngine.run({ original: "", modified: "x\ny" })
    expect(emptyToContent.output.diff.added).toBe(2)

    const contentToEmpty = await textDiffEngine.run({ original: "x", modified: "" })
    expect(contentToEmpty.output.diff.removed).toBe(1)

    const bothEmpty = await textDiffEngine.run({ original: "", modified: "" })
    expect(bothEmpty.output.diff.ops).toHaveLength(0)
    expect(bothEmpty.output.diff.unchanged).toBe(0)
  })

  it("rejects a side over the limit", async () => {
    const error = await textDiffEngine
      .run({ original: "a".repeat(TEXT_DIFF_MAX_CHARS + 1), modified: "b" })
      .catch((e: unknown) => e)
    expect(error).toBeInstanceOf(ToolExecutionError)
    expect((error as ToolExecutionError).code).toBe("VALIDATION")
  })
})
