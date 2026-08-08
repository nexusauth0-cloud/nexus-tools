import { describe, expect, it } from "vitest"
import { z } from "zod"
import {
  arrayField,
  fileField,
  firstIssueMessage,
  integerField,
  jsonField,
  numberField,
  optionalTextField,
  runSchemaValidation,
  textField,
  urlField,
  zodIssuesToIssues,
  zodPathToField,
} from "../validation"

describe("textField", () => {
  it("requires at least one character by default", () => {
    const result = textField().safeParse("")
    expect(result.success).toBe(false)
    if (!result.success)
      expect(result.error.issues[0].message).toBe("At least 1 character required.")
  })

  it("trims input by default", () => {
    expect(textField().parse("  hello  ")).toBe("hello")
  })

  it("enforces min and max lengths", () => {
    const field = textField({ min: 3, max: 5 })
    expect(field.safeParse("ab").success).toBe(false)
    expect(field.safeParse("abcdef").success).toBe(false)
    expect(field.safeParse("abcde").success).toBe(true)
  })
})

describe("optionalTextField", () => {
  it("allows empty values", () => {
    expect(optionalTextField().safeParse("").success).toBe(true)
  })

  it("trims provided values", () => {
    expect(optionalTextField().parse("  x  ")).toBe("x")
  })
})

describe("integerField / numberField", () => {
  it("rejects non-numbers and non-integers", () => {
    expect(integerField().safeParse("7").success).toBe(false)
    expect(integerField().safeParse(1.5).success).toBe(false)
  })

  it("enforces the default minimum of zero", () => {
    expect(integerField().safeParse(-1).success).toBe(false)
  })

  it("respects explicit bounds", () => {
    expect(integerField(2, 4).safeParse(5).success).toBe(false)
    expect(integerField(2, 4).safeParse(3).success).toBe(true)
  })

  it("numberField allows fractional values", () => {
    expect(numberField().safeParse(1.5).success).toBe(true)
  })
})

describe("urlField", () => {
  it("accepts absolute http(s) URLs", () => {
    expect(urlField().safeParse("https://example.com").success).toBe(true)
  })

  it("rejects bare strings", () => {
    expect(urlField().safeParse("example.com").success).toBe(false)
  })
})

describe("jsonField", () => {
  it("parses valid JSON into a value", () => {
    expect(jsonField().parse('{"a":1}')).toEqual({ a: 1 })
  })

  it("produces a human-readable invalid-JSON message", () => {
    const result = jsonField().safeParse("{oops}")
    expect(result.success).toBe(false)
    if (!result.success) expect(result.error.issues[0].message).toContain("Invalid JSON:")
  })

  it("rejects empty input", () => {
    expect(jsonField().safeParse("").success).toBe(false)
  })
})

describe("fileField", () => {
  it("accepts File-like values", () => {
    const fake = { name: "a.json", size: 10, type: "application/json" }
    expect(fileField().safeParse(fake).success).toBe(true)
  })

  it("rejects plain values", () => {
    expect(fileField().safeParse("nope").success).toBe(false)
  })

  it("enforces a max byte size", () => {
    const field = fileField({ maxBytes: 5 })
    expect(field.safeParse({ name: "a.json", size: 10, type: "application/json" }).success).toBe(
      false
    )
    expect(field.safeParse({ name: "a.json", size: 3, type: "application/json" }).success).toBe(
      true
    )
  })
})

describe("arrayField", () => {
  it("enforces min and max item counts", () => {
    const field = arrayField(z.string(), { min: 1, max: 3 })
    expect(field.safeParse([]).success).toBe(false)
    expect(field.safeParse(["a", "b", "c", "d"]).success).toBe(false)
    expect(field.safeParse(["a", "b"]).success).toBe(true)
  })
})

describe("zodPathToField", () => {
  it("produces dot-paths with array indices", () => {
    expect(zodPathToField(["options", 0, "limit"])).toBe("options[0].limit")
    expect(zodPathToField(["input"])).toBe("input")
  })
})

describe("zodIssuesToIssues + runSchemaValidation + firstIssueMessage", () => {
  const schema = z.object({ input: textField(), count: integerField() })

  it("normalizes issues into canonical shape", () => {
    const result = runSchemaValidation(schema, { input: "", count: "x" })
    expect(result.ok).toBe(false)
    expect(result.issues).toHaveLength(2)
    expect(result.issues[0].field).toBe("input")
    expect(result.issues[0].message).toContain("character")
  })

  it("reports success with no issues", () => {
    const result = runSchemaValidation(schema, { input: "ok", count: 2 })
    expect(result.ok).toBe(true)
    expect(result.issues).toEqual([])
  })

  it("returns the first message with a fallback", () => {
    expect(firstIssueMessage([{ field: "", message: "Nope." }])).toBe("Nope.")
    expect(firstIssueMessage([])).toBe("Please review your input.")
  })

  it("maps raw zod errors through zodIssuesToIssues", () => {
    const issues = zodIssuesToIssues(schema.safeParse({ count: 1 }).error?.issues ?? [])
    expect(issues[0].field).toBe("input")
  })
})
