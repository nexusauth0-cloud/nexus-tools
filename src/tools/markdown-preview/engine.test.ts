import { describe, expect, it } from "vitest"
import { ToolExecutionError } from "@/lib/tool-engine"
import { markdownPreviewEngine, MARKDOWN_MAX_CHARS } from "./engine"

describe("markdownPreviewEngine", () => {
  it("renders headings, paragraphs, and lists", async () => {
    const result = await markdownPreviewEngine.run({ input: "# Title\n\n- one\n- two" })
    expect(result.output.html).toContain("<h1>Title</h1>")
    expect(result.output.html).toContain("<ul><li>one</li><li>two</li></ul>")
  })

  it("renders tables and code blocks", async () => {
    const result = await markdownPreviewEngine.run({
      input: "| a | b |\n| --- | --- |\n| 1 | 2 |\n\n```js\nconst x = 1\n```",
    })
    expect(result.output.html).toContain("<table>")
    expect(result.output.html).toContain("const x = 1")
  })

  it("reports text stats alongside the render", async () => {
    const result = await markdownPreviewEngine.run({ input: "hello world" })
    expect(result.output.stats.words).toBe(2)
    expect(result.output.stats.characters).toBe(11)
  })

  it("escapes raw HTML never rendering live tags", async () => {
    const result = await markdownPreviewEngine.run({ input: "<script>alert(1)</script>" })
    expect(result.output.html).not.toContain("<script>")
    expect(result.output.html).toContain("&lt;script&gt;")
  })

  it("strips javascript: URLs", async () => {
    const result = await markdownPreviewEngine.run({ input: "[click](javascript:alert(1))" })
    expect(result.output.html).not.toContain("href=")
    expect(result.output.html).toContain("click")
  })

  it("handles empty input", async () => {
    const result = await markdownPreviewEngine.run({ input: "" })
    expect(result.output.html).toBe("")
  })

  it("rejects input over the limit", async () => {
    const error = await markdownPreviewEngine
      .run({ input: "a".repeat(MARKDOWN_MAX_CHARS + 1) })
      .catch((e: unknown) => e)
    expect(error).toBeInstanceOf(ToolExecutionError)
    expect((error as ToolExecutionError).code).toBe("VALIDATION")
    expect((error as ToolExecutionError).issues[0].message).toContain("400000")
  })
})
