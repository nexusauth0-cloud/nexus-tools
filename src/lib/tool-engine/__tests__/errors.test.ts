import { describe, expect, it } from "vitest"
import { formatIssuesForDisplay, toToolError } from "../errors"
import { ToolExecutionError } from "../types"
import { textField } from "../validation"
import { z } from "zod"

describe("toToolError", () => {
  it("passes ToolExecutionError through unchanged", () => {
    const original = new ToolExecutionError("VALIDATION", "Nope.", [
      { field: "input", message: "Nope." },
    ])
    expect(toToolError(original)).toBe(original)
  })

  it("maps zod errors into VALIDATION with issues", () => {
    const parsed = z.object({ input: textField() }).safeParse({ input: "" })
    expect(parsed.success).toBe(false)
    if (parsed.success) return
    const error = toToolError(parsed.error)
    expect(error.code).toBe("VALIDATION")
    expect(error.issues[0].field).toBe("input")
  })

  it("maps thrown errors to USER-safe messages without leaking details", () => {
    const error = toToolError(new Error("secret internal details"))
    expect(error.code).toBe("UNKNOWN")
    expect(error.toUserMessage()).not.toContain("secret")
    expect(error.toUserMessage()).toContain("Something went wrong")
  })

  it("maps non-errors to UNKNOWN", () => {
    expect(toToolError(42).code).toBe("UNKNOWN")
    expect(toToolError(null).code).toBe("UNKNOWN")
  })
})

describe("formatIssuesForDisplay", () => {
  it("summarizes single issues", () => {
    expect(formatIssuesForDisplay([{ field: "", message: "First." }])).toBe("First.")
  })

  it("appends a count for multiple issues", () => {
    const issues = [
      { field: "", message: "First." },
      { field: "", message: "Second." },
    ]
    expect(formatIssuesForDisplay(issues)).toBe("First. (and 1 more.)")
  })

  it("falls back for empty input", () => {
    expect(formatIssuesForDisplay([])).toContain("Something went wrong")
  })
})
