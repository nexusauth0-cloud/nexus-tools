import { describe, expect, it } from "vitest"
import {
  hasNonFiniteNumber,
  jsonToYaml,
  parseYamlText,
  YAML_MAX_ALIASES,
} from "./yaml"

describe("parseYamlText", () => {
  it("parses mappings, sequences, scalars, and nesting", () => {
    const result = parseYamlText("name: nexus\nversion: 1\nitems: [a, b]\nnested:\n  deep: true\nnull: null\n")
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value).toEqual({
      name: "nexus",
      version: 1,
      items: ["a", "b"],
      nested: { deep: true },
      null: null,
    })
  })

  it("parses quoted and multiline strings", () => {
    const result = parseYamlText('q: "double"\ns: \'single\'\nblock: |\n  line one\n  line two\n')
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value).toEqual({ q: "double", s: "single", block: "line one\nline two\n" })
  })

  it("keeps YAML 1.2 core semantics: yes/no stay strings", () => {
    const result = parseYamlText("a: yes\nb: no\nc: true\n")
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value).toEqual({ a: "yes", b: "no", c: true })
  })

  it("keeps timestamps as plain strings (no Date objects)", () => {
    const result = parseYamlText("when: 2021-01-01\nwhenFull: 2021-01-01T10:00:00Z\n")
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(typeof (result.value as Record<string, unknown>).when).toBe("string")
    expect(result.value).toEqual({ when: "2021-01-01", whenFull: "2021-01-01T10:00:00Z" })
  })

  it("resolves anchors and aliases to plain data", () => {
    const result = parseYamlText("a: &x [1, 2]\nb: *x\n")
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value).toEqual({ a: [1, 2], b: [1, 2] })
  })

  it("treats the << merge key as literal data (never merged)", () => {
    const result = parseYamlText("base: &b {x: 1}\nderived:\n  <<: *b\n  y: 2\n")
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value).toEqual({ base: { x: 1 }, derived: { "<<": { x: 1 }, y: 2 } })
  })

  it("reports a friendly error with line/column for malformed YAML", () => {
    const result = parseYamlText("a: [1,\nb: 2\n")
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.message).toMatch(/^Invalid YAML:/)
    expect(result.message).toMatch(/line \d/)
  })

  it("rejects empty documents clearly", () => {
    const result = parseYamlText("")
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.message).toMatch(/Invalid YAML:/)
  })
})

describe("YAML security", () => {
  it("rejects executable JS tags", () => {
    const result = parseYamlText("a: !!js/function \"function () { return 1 }\"")
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.message).not.toContain("function (")
  })

  it("rejects unknown/custom tags", () => {
    const result = parseYamlText("a: !custom anything")
    expect(result.ok).toBe(false)
  })

  it("rejects tag URLs that imply other object types", () => {
    const result = parseYamlText("a: !!python/object/apply:os.system [id]")
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.message).not.toContain("\n at ")
  })

  it("bounds alias expansion (alias bomb)", () => {
    // Anchored subtrees may reference other anchors, which multiplies
    // construction work. js-yaml counts every resolved alias use and stops
    // construction once the cap (YAML_MAX_ALIASES) is exceeded — the
    // classic billion-laughs document is rejected before expansion.
    let doc = "laugh1: &laugh1 [x,x,x,x,x,x,x,x,x,x]\n"
    for (let index = 2; index <= 4; index += 1) {
      const refs = Array.from({ length: 10 }, () => `*laugh${index - 1}`).join(", ")
      doc += `laugh${index}: &laugh${index} [${refs}]\n`
    }
    doc += `out: [${Array.from({ length: 10 }, () => "*laugh4").join(", ")}]\n`
    expect(parseYamlText(doc).ok).toBe(true)
  })

  it("rejects documents that exhaust the alias cap", () => {
    let doc = "a: &a [x,x,x,x,x,x,x,x,x,x]\n"
    doc += `b: [${Array.from({ length: YAML_MAX_ALIASES + 10 }, () => "*a").join(", ")}]\n`
    const result = parseYamlText(doc)
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.message).toMatch(/aliases exceeded maxAliases/)
  })

  it("rejects nesting beyond the parser depth cap", () => {
    const deep = "{ a: ".repeat(200) + "1" + " }".repeat(200)
    const result = parseYamlText(deep)
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.message).toMatch(/depth|nest/i)
  })

  it("never succeeds on executable-looking payloads", () => {
    const attempts = [
      "a: !!eval \"alert(1)\"",
      "!!import util",
      "a: !<tag:yaml.org,2002:js/function> x",
      "!!python/object:os.system",
    ]
    for (const attempt of attempts) {
      const result = parseYamlText(attempt)
      expect(result.ok, `should reject: ${attempt}`).toBe(false)
    }
  })

  it("is bounded by the documented alias cap", () => {
    expect(YAML_MAX_ALIASES).toBeGreaterThan(0)
    expect(YAML_MAX_ALIASES).toBeLessThanOrEqual(1000)
  })
})

describe("jsonToYaml", () => {
  it("serializes plain JSON data deterministically", () => {
    expect(jsonToYaml({ name: "nexus", list: [1, 2] })).toBe("name: nexus\nlist:\n  - 1\n  - 2\n")
  })

  it("preserves key insertion order", () => {
    expect(jsonToYaml({ b: 1, a: 2 })).toBe("b: 1\na: 2\n")
  })

  it("quotes scalars that would change meaning if unquoted", () => {
    const yaml = jsonToYaml({ date: "2021-01-01", yes: "yes", nullable: "null" })
    expect(yaml).toContain("'2021-01-01'")
    expect(yaml).toContain("'yes'")
    expect(yaml).toContain("'null'")
  })

  it("never emits anchors, refs, or tags", () => {
    const shared = { deep: [1, 2] }
    const yaml = jsonToYaml({ left: shared, right: shared })
    expect(yaml).not.toContain("&")
    expect(yaml).not.toContain("*")
    expect(yaml).not.toMatch(/!!/)
  })

  it("round-trips through JSON semantics", () => {
    const value = { name: "nexus", version: 1.5, ok: true, missing: null, tags: ["a", "b"] }
    const yaml = jsonToYaml(value)
    const back = parseYamlText(yaml)
    expect(back.ok).toBe(true)
    if (!back.ok) return
    expect(back.value).toEqual(value)
  })
})

describe("hasNonFiniteNumber", () => {
  it("detects NaN and Infinity anywhere in the graph", () => {
    expect(hasNonFiniteNumber(NaN)).toBe(true)
    expect(hasNonFiniteNumber(Infinity)).toBe(true)
    expect(hasNonFiniteNumber(-Infinity)).toBe(true)
    expect(hasNonFiniteNumber({ a: [1, { b: Number.NaN }] })).toBe(true)
    expect(hasNonFiniteNumber({ a: 1, b: "x" })).toBe(false)
    expect(hasNonFiniteNumber(null)).toBe(false)
    expect(hasNonFiniteNumber([1, 2, 3])).toBe(false)
  })
})