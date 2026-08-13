import { describe, expect, it } from "vitest"
import { validateStaticConfig } from "./registry"

const validConfig = {
  tools: [
    {
      id: "yaml",
      title: "YAML ↔ JSON",
      category: "data",
      icon: "bars",
      accent: "#e5534b",
      entryPoint: "tools:yaml",
      description: ["Converts YAML to JSON and back."],
      faq: [{ q: "question?", a: ["answer."] }],
    },
    {
      id: "json",
      title: "JSON tools",
      category: "data",
      icon: "braces",
      accent: "#a371f7",
      entryPoint: "tools:json",
      description: ["Formats JSON."],
      faq: [],
    },
  ],
}

describe("validateStaticConfig", () => {
  it("accepts a valid config", () => {
    expect(validateStaticConfig(validConfig)).toEqual([])
  })

  it("rejects a non-object config", () => {
    expect(validateStaticConfig(null)).not.toEqual([])
    expect(validateStaticConfig([1])).not.toEqual([])
  })

  it("rejects missing tools", () => {
    const problems = validateStaticConfig({})
    expect(problems.some((p) => /tools must be a non-empty/.test(p))).toBe(true)
  })

  it("rejects duplicate ids and bad accents", () => {
    const duplicate = {
      tools: [validConfig.tools[0], { ...validConfig.tools[0], id: "yaml" }],
    }
    const problems = validateStaticConfig(duplicate)
    expect(problems.some((p) => /duplicates/.test(p))).toBe(true)
  })

  it("rejects bad accents and missing entry points", () => {
    const problems = validateStaticConfig({
      tools: [
        { ...validConfig.tools[0], accent: "red" },
        { ...validConfig.tools[1], entryPoint: "" },
      ],
    })
    expect(problems.some((p) => /accent/.test(p))).toBe(true)
    expect(problems.some((p) => /entryPoint/.test(p))).toBe(true)
  })

  it("rejects duplicate param keys", () => {
    const problems = validateStaticConfig({
      tools: [
        {
          ...validConfig.tools[0],
          params: [
            { key: "a", label: "A" },
            { key: "a", label: "B" },
          ],
        },
      ],
    })
    expect(problems.some((p) => /duplicates "a"/.test(p))).toBe(true)
  })
})
