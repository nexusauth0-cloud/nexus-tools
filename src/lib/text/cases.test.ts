import { describe, expect, it } from "vitest"
import { applyCase, splitWords, type CaseMode } from "./cases"

describe("splitWords", () => {
  it("splits on separators and keeps apostrophes internal", () => {
    expect(splitWords("hello, world! don't")).toEqual(["hello", "world", "don't"])
  })

  it("splits on case boundaries", () => {
    expect(splitWords("camelCase")).toEqual(["camel", "Case"])
    expect(splitWords("HTTPServer")).toEqual(["HTTP", "Server"])
  })

  it("splits on letter↔digit boundaries", () => {
    expect(splitWords("value2")).toEqual(["value", "2"])
    expect(splitWords("2value")).toEqual(["2", "value"])
    expect(splitWords("123 values")).toEqual(["123", "values"])
  })
})

describe("applyCase — basic modes", () => {
  it("lowercases and uppercases without destroying Unicode", () => {
    expect(applyCase("lower", "HELLO ÉTÉ")).toBe("hello été")
    expect(applyCase("upper", "hello été 👋")).toBe("HELLO ÉTÉ 👋")
  })

  it("titles with the documented simple rule", () => {
    expect(applyCase("title", "hello world")).toBe("Hello World")
    expect(applyCase("title", "don't stop")).toBe("Don't Stop")
    expect(applyCase("title", "123 values")).toBe("123 Values")
  })

  it("sentence-cases with the documented simple rule", () => {
    expect(applyCase("sentence", "HELLO WORLD. THIS is a TEST")).toBe("Hello world. This is a test")
    expect(applyCase("sentence", "hello world")).toBe("Hello world")
  })

  it("toggles letter case, leaving everything else alone", () => {
    expect(applyCase("toggle", "Hello World 123!")).toBe("hELLO wORLD 123!")
    expect(applyCase("toggle", "café 👋")).toBe("CAFÉ 👋")
  })
})

describe("applyCase — separated modes", () => {
  const inputs: Array<[string, string]> = [
    ["hello world", "helloWorld"],
    ["Hello World", "helloWorld"],
    ["HELLO WORLD", "helloWorld"],
    ["hello-world", "helloWorld"],
    ["hello_world", "helloWorld"],
    ["camelCase", "camelCase"],
    ["PascalCase", "pascalCase"],
    ["123 values", "123Values"],
    ["hello, world!", "helloWorld"],
    ["multiple   spaces  here", "multipleSpacesHere"],
    ["line one\nline two", "lineOneLineTwo"],
    ["café déjà vu", "caféDéjàVu"],
    ["hello 👋 world", "helloWorld"],
  ]

  for (const [input, expected] of inputs) {
    it(`camel: ${JSON.stringify(input)} → ${expected}`, () => {
      expect(applyCase("camel", input)).toBe(expected)
    })
  }

  const pascalInputs: Array<[string, string]> = [
    ["hello world", "HelloWorld"],
    ["camelCase", "CamelCase"],
    ["123 values", "123Values"],
  ]
  for (const [input, expected] of pascalInputs) {
    it(`pascal: ${JSON.stringify(input)} → ${expected}`, () => {
      expect(applyCase("pascal", input)).toBe(expected)
    })
  }

  it("snake_case", () => {
    expect(applyCase("snake", "Hello World!")).toBe("hello_world")
    expect(applyCase("snake", "camelCase2Value")).toBe("camel_case_2_value")
    expect(applyCase("snake", "café déjà")).toBe("café_déjà")
  })

  it("kebab-case", () => {
    expect(applyCase("kebab", "Hello World!")).toBe("hello-world")
    expect(applyCase("kebab", "multi   spaces")).toBe("multi-spaces")
  })

  it("CONSTANT_CASE", () => {
    expect(applyCase("constant", "hello world")).toBe("HELLO_WORLD")
    expect(applyCase("constant", "value2")).toBe("VALUE_2")
  })

  it("dot.case and slash/case", () => {
    expect(applyCase("dot", "Hello World")).toBe("hello.world")
    expect(applyCase("slash", "Hello World")).toBe("hello/world")
  })

  it("handles punctuation-only and emoji separators deterministically", () => {
    expect(applyCase("snake", "a — b")).toBe("a_b")
    expect(applyCase("kebab", "!@#$%^&*()")).toBe("")
  })
})

describe("applyCase — empty and pathological", () => {
  it("returns empty string for empty input in every mode", () => {
    for (const mode of CASE_MODES_ALL) {
      expect(applyCase(mode, "")).toBe("")
    }
  })

  it("is deterministic across repeated calls", () => {
    const a = applyCase("title", "the quick brown fox")
    const b = applyCase("title", "the quick brown fox")
    expect(a).toBe(b)
    expect(applyCase("snake", "Hello World")).toBe(applyCase("snake", "Hello World"))
  })

  it("keeps accented uppercase letters intact under uppercase", () => {
    expect(applyCase("upper", "straße")).toBe("STRASSE")
  })
})

const CASE_MODES_ALL: readonly CaseMode[] = [
  "lower",
  "upper",
  "title",
  "sentence",
  "camel",
  "pascal",
  "snake",
  "kebab",
  "constant",
  "dot",
  "slash",
  "toggle",
]
