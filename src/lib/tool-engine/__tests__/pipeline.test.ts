import { describe, expect, it, vi } from "vitest"
import { z } from "zod"
import { createToolEngine } from "../pipeline"
import { ToolExecutionError, type ToolContext } from "../types"
import { integerField, textField } from "../validation"

const schema = z.object({
  input: textField(),
  count: integerField(),
})

function makeEngine() {
  const seenContext: { toolId?: string } = {}
  const process = vi.fn(async (value: z.infer<typeof schema>, context: ToolContext) => {
    seenContext.toolId = context.toolId
    return { echoed: value.input, doubled: value.count * 2 }
  })
  const engine = createToolEngine({ toolId: "test-tool", schema, process })
  return { engine, process, seenContext }
}

describe("createToolEngine.summarize", () => {
  it("exposes the declared summarizer on the engine (used by useTool history)", () => {
    const { engine } = makeEngine()
    expect(engine.summarize).toBeUndefined()

    const withSummaries = createToolEngine({
      toolId: "test-tool",
      schema,
      process: () => ({ echoed: "", doubled: 0 }),
      summarize: {
        input: (value) => `count=${value.count}`,
        output: (value) => `doubled=${value.doubled}`,
      },
    })
    expect(withSummaries.summarize?.input?.({ input: "x", count: 3 })).toBe("count=3")
    expect(withSummaries.summarize?.output?.({ echoed: "x", doubled: 6 })).toBe("doubled=6")
  })
})

describe("createToolEngine.run", () => {
  it("returns a measured, id-stamped result", async () => {
    const { engine, process, seenContext } = makeEngine()
    const result = await engine.run({ input: "hi", count: 3 })

    expect(process).toHaveBeenCalledTimes(1)
    expect(process.mock.calls[0][0]).toEqual({ input: "hi", count: 3 })
    expect(seenContext.toolId).toBe("test-tool")
    expect(result.output).toEqual({ echoed: "hi", doubled: 6 })
    expect(result.runId).toMatch(/^[a-f0-9-]{36}$/)
    expect(result.metrics.validationMs).toBeGreaterThanOrEqual(0)
    expect(result.metrics.processingMs).toBeGreaterThanOrEqual(0)
    expect(result.metrics.startedAt).toBeGreaterThanOrEqual(0)
  })

  it("throws a VALIDATION error with issues for bad input", async () => {
    const { engine, process } = makeEngine()
    await expect(engine.run({ input: "", count: -1 })).rejects.toMatchObject({
      code: "VALIDATION",
      message: "Please fix your input and try again.",
    })
    expect(process).not.toHaveBeenCalled()
  })

  it("maps thrown processing errors to ToolExecutionError", async () => {
    const engine = createToolEngine({
      toolId: "test-tool",
      schema,
      process: () => {
        throw new Error("boom")
      },
    })
    const error = await engine.run({ input: "x", count: 1 }).catch((e: unknown) => e)
    expect(error).toBeInstanceOf(ToolExecutionError)
    expect((error as ToolExecutionError).code).toBe("UNKNOWN")
    expect((error as ToolExecutionError).toUserMessage()).toContain("Something went wrong")
    expect(JSON.stringify(error)).not.toContain("boom")
  })

  it("runs normalize before validation", async () => {
    const engine = createToolEngine({
      toolId: "test-tool",
      schema,
      normalize: (raw) => ({ ...raw, input: String(raw.input ?? "").toUpperCase() }),
      process: async (value) => value.input,
    })
    const result = await engine.run({ input: "hi", count: 1 })
    expect(result.output).toBe("HI")
  })

  it("invokes onSuccess and onError callbacks", async () => {
    const { engine } = makeEngine()
    const onSuccess = vi.fn()
    const onError = vi.fn()

    await engine.run({ input: "ok", count: 2 }, { onSuccess, onError })
    expect(onSuccess).toHaveBeenCalledTimes(1)
    expect(onError).not.toHaveBeenCalled()

    await expect(
      engine.run({ input: "", count: -1 }, { onSuccess, onError })
    ).rejects.toBeInstanceOf(ToolExecutionError)
    expect(onError).toHaveBeenCalledTimes(1)
  })

  it("streams phase transitions via onPhase", async () => {
    const { engine } = makeEngine()
    const phases: string[] = []
    await engine.run({ input: "ok", count: 1 }, { onPhase: (phase) => phases.push(phase) })
    expect(phases).toEqual(["validating", "processing"])
  })
})

describe("createToolEngine.validate", () => {
  it("validates without side effects", () => {
    const { engine, process } = makeEngine()
    expect(engine.validate({ input: "", count: 1 })).toMatchObject({ ok: false })
    expect(engine.validate({ input: "a", count: 1 })).toMatchObject({ ok: true })
    expect(process).not.toHaveBeenCalled()
  })
})
