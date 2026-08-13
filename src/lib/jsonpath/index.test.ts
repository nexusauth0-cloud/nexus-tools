import { describe, expect, it } from "vitest"
import { parseJsonPath, queryJsonPath, JsonPathError, DEFAULT_JSONPATH_LIMITS } from "./index"
import { evaluate } from "./evaluate"

const STORE = {
  store: {
    book: [
      { category: "fiction", author: "Nigel Rees", title: "Sayings of the Century", price: 8.95 },
      { category: "fiction", author: "Evelyn Waugh", title: "Sword of Honour", price: 12.99 },
      { category: "nonfiction", author: "Herman Melville", title: "Moby Dick", price: 8.99 },
    ],
    bicycle: { color: "red", price: 19.95 },
  },
}

function run(expression: string, document: unknown = STORE) {
  return evaluate(document, parseJsonPath(expression))
}

describe("supported syntax", () => {
  it("root resolves to the document", () => {
    expect(run("$")[0].value).toEqual(STORE)
  })

  it("child access via dot and bracket", () => {
    expect(run("$.store.book")[0].value).toBe(STORE.store.book)
    expect(run("$['store']['bicycle']")[0].value).toBe(STORE.store.bicycle)
  })

  it("array index and negative index", () => {
    expect(run("$.store.book[0].title")[0].value).toBe("Sayings of the Century")
    expect(run("$.store.book[-1].title")[0].value).toBe("Moby Dick")
  })

  it("wildcard over arrays and objects", () => {
    expect(run("$.store.book[*].author").map((match) => match.value)).toEqual([
      "Nigel Rees",
      "Evelyn Waugh",
      "Herman Melville",
    ])
    expect(
      run("$.store.bicycle[*]")
        .map((match) => match.value)
        .sort()
    ).toEqual([19.95, "red"])
  })

  it("recursive descent", () => {
    expect(
      run("$..author")
        .map((match) => match.value)
        .sort()
    ).toEqual(["Evelyn Waugh", "Herman Melville", "Nigel Rees"])
    expect(run("$..price").length).toBe(4)
  })

  it("slices", () => {
    expect(run("$.store.book[0:2].title").map((match) => match.value)).toEqual([
      "Sayings of the Century",
      "Sword of Honour",
    ])
    expect(run("$.store.book[::-1].title").map((match) => match.value)).toEqual([
      "Moby Dick",
      "Sword of Honour",
      "Sayings of the Century",
    ])
  })

  it("unions", () => {
    expect(run("$.store.book[0,2].author").map((match) => match.value)).toEqual([
      "Nigel Rees",
      "Herman Melville",
    ])
    expect(run("$['store']['book','bicycle']").length).toBe(2)
  })

  it("filters with comparisons and logic", () => {
    expect(run("$.store.book[?(@.price < 10)].title").map((match) => match.value)).toEqual([
      "Sayings of the Century",
      "Moby Dick",
    ])
    expect(
      run('$.store.book[?(@.category == "fiction" && @.price > 10)].author').map((m) => m.value)
    ).toEqual(["Evelyn Waugh"])
    expect(
      run('$.store.book[?(@.category == "fiction" || @.category == "nonfiction")]').length
    ).toBe(3)
    expect(run("$.store.book[?(!(@.price > 9))].title").map((m) => m.value)).toEqual([
      "Sayings of the Century",
      "Moby Dick",
    ])
  })

  it("records canonical paths", () => {
    const matches = run("$.store.book[*].author")
    expect(matches.map((match) => match.path)).toEqual([
      "$.store.book[0].author",
      "$.store.book[1].author",
      "$.store.book[2].author",
    ])
  })

  it("returns no matches gracefully", () => {
    expect(run("$.store.doesNotExist")).toEqual([])
    expect(run("$..missing")).toEqual([])
  })
})

describe("unicode", () => {
  it("matches unicode keys and values", () => {
    const doc = { café: { 城市: 1 }, "emoji🎉": true }
    expect(run("$.café.城市", doc)[0].value).toBe(1)
    expect(run("$.书店", doc)).toEqual([])
    expect(run("$['emoji🎉']", doc)[0].value).toBe(true)
  })
})

describe("prototype-like keys stay ordinary data", () => {
  it("queries __proto__ / constructor / prototype keys without touching real prototypes", () => {
    const doc = JSON.parse(
      '{"__proto__": {"polluted": true}, "constructor": 1, "prototype": {"x": 2}}'
    )
    expect(run("$.__proto__.polluted", doc)[0].value).toBe(true)
    expect(run("$.constructor", doc)[0].value).toBe(1)
    expect(run("$.prototype.x", doc)[0].value).toBe(2)
    // No pollution: Object prototype must be untouched.
    expect(({} as Record<string, unknown>).polluted).toBeUndefined()
    expect(Object.prototype).not.toHaveProperty("polluted")
  })
})

describe("syntax errors", () => {
  it("rejects expressions that do not start with $", () => {
    expect(() => parseJsonPath("store.book")).toThrow(JsonPathError)
  })

  it("rejects malformed brackets and quotes", () => {
    expect(() => parseJsonPath("$[0")).toThrow(JsonPathError)
    expect(() => parseJsonPath("$['unterminated]")).toThrow(JsonPathError)
    expect(() => parseJsonPath("$..")).toThrow(JsonPathError)
  })

  it("rejects unsupported constructs explicitly", () => {
    expect(() => parseJsonPath("$.[0]")).toThrow(JsonPathError)
    expect(() => parseJsonPath("$/foo")).toThrow(JsonPathError)
  })

  it("rejects empty expressions", () => {
    expect(() => parseJsonPath("   ")).toThrow(/empty/)
  })
})

describe("limits", () => {
  it("reports LIMIT errors instead of truncating results", () => {
    const big = { items: Array.from({ length: 6000 }, (_, i) => ({ i })) }
    const result = queryJsonPath(big, "$.items[*]", {
      ...DEFAULT_JSONPATH_LIMITS,
      maxResults: 5000,
    })
    expect(result.ok).toBe(false)
    expect(result.error?.code).toBe("LIMIT")
  })

  it("fails gracefully on visit-budget exhaustion", () => {
    const doc = { a: Array.from({ length: 40 }, (_, i) => ({ deep: { value: i } })) }
    const result = queryJsonPath(doc, "$..value", { maxVisits: 100, maxResults: 1000 })
    expect(result.ok).toBe(false)
    expect(result.error?.code).toBe("LIMIT")
  })

  it("rejects overly long expressions", () => {
    expect(() => parseJsonPath(`$.${"a".repeat(401)}`)).toThrow(/too long/)
  })
})

describe("queryJsonPath API", () => {
  it("returns structured matches with JSON representations", () => {
    const result = queryJsonPath({ a: "plain", b: [1, 2] }, "$.a")
    expect(result.ok).toBe(true)
    expect(result.matches[0]).toMatchObject({ path: "$.a", value: "plain", json: '"plain"' })
  })
})

describe("evaluation safety", () => {
  it("does not execute code in expressions or values", () => {
    const doc = {
      evil: "process.exit(1)",
      "constructor.constructor": "alert(1)",
      fn: { toString: { valueOf: 1 } },
    }
    const result = queryJsonPath(doc, "$.evil")
    expect(result.ok).toBe(true)
    expect(result.matches[0].value).toBe("process.exit(1)")
  })

  it("never mutates the input document", () => {
    const doc = { a: { b: 1 } }
    run("$..b", doc)
    expect(JSON.stringify(doc)).toBe('{"a":{"b":1}}')
  })
})
