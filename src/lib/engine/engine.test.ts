import { describe, expect, it } from "vitest"
import { checkDepth, checkInputCaps, runTool, type StaticToolEntry } from "./engine"

const echoTool: StaticToolEntry = {
  id: "echo",
  title: "Echo",
  entryPoint: "tools:echo",
  run: (input) => ({ ok: true, output: input }),
}

const failTool: StaticToolEntry = {
  id: "fail",
  title: "Fail",
  entryPoint: "tools:fail",
  run: (_input, params) => ({
    ok: false,
    output: "default",
    errorCode: params["mode"] ?? "default/blank-input",
  }),
}

describe("checkInputCaps", () => {
  it("rejects blank input", () => {
    expect(checkInputCaps("")).toBe("default/blank-input")
    expect(checkInputCaps("   \n ")).toBe("default/blank-input")
  })
  it("passes normal input", () => {
    expect(checkInputCaps("a: 1")).toBeUndefined()
  })
  it("rejects oversized input", () => {
    expect(checkInputCaps("x".repeat(500_001))).toBe("input/too-large")
  })
})

describe("checkDepth", () => {
  it("accepts shallow documents", () => {
    expect(checkDepth({ a: [1, 2] }, 100)).toBeUndefined()
  })
  it("rejects documents deeper than the cap", () => {
    const deep: unknown[] = []
    let cursor: unknown[] = deep
    for (let index = 0; index < 120; index += 1) {
      const next: unknown[] = []
      cursor.push(next)
      cursor = next
    }
    expect(checkDepth(deep, 100)).toBe("depth/too-deep")
  })
})

describe("runTool", () => {
  it("returns the tool output", async () => {
    const outcome = await runTool("echo", { input: "hello" }, [echoTool])
    expect(outcome.ok).toBe(true)
    expect(outcome.output).toBe("hello")
  })

  it("reports a missing tool cleanly", async () => {
    const outcome = await runTool("nope", { input: "x" }, [echoTool])
    expect(outcome.ok).toBe(false)
    expect(outcome.error?.message).toMatch(/does not exist/)
  })

  it("normalizes known error codes", async () => {
    const outcome = await runTool("fail", { input: "x" }, [failTool])
    expect(outcome.ok).toBe(false)
    expect(outcome.error?.message).toMatch(/Enter some input/)
  })

  it("rejects leaked stack traces", async () => {
    const explode: StaticToolEntry = {
      id: "explode",
      title: "Explode",
      entryPoint: "tools:explode",
      run: () => {
        throw new Error("TypeError: oops\n    at file:///etc/passwd")
      },
    }
    const outcome = await runTool("explode", { input: "x" }, [explode])
    expect(outcome.ok).toBe(false)
    expect(outcome.error?.message).not.toContain("passwd")
  })

  it("caps oversized output", async () => {
    const big: StaticToolEntry = {
      id: "big",
      title: "Big",
      entryPoint: "tools:big",
      run: () => ({ ok: true, output: "y".repeat(2_000_001) }),
    }
    const outcome = await runTool("big", { input: "x" }, [big])
    expect(outcome.ok).toBe(false)
    expect(outcome.error?.message).toMatch(/too large/)
  })
})