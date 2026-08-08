import { describe, expect, it } from "vitest"
import { htmlDecode, htmlEncode } from "@/lib/encoding"
import { htmlEntityEncoderEngine } from "./engine"

describe("htmlEncode / htmlDecode", () => {
  it("escapes all five significant characters", () => {
    expect(htmlEncode("<a href=\"x\" title='y'>a & b</a>")).toBe(
      "&lt;a href=&quot;x&quot; title=&#39;y&#39;&gt;a &amp; b&lt;/a&gt;"
    )
  })

  it("escapes ampersand before other characters in input order", () => {
    expect(htmlEncode("&amp;")).toBe("&amp;amp;")
  })

  it("decodes named entities", () => {
    expect(htmlDecode("&lt;a&gt; &amp; &quot;q&quot; &#39;apos&#39;")).toBe("<a> & \"q\" 'apos'")
  })

  it("decodes numeric decimal and hex entities", () => {
    expect(htmlDecode("&#65;&#x42;")).toBe("AB")
    expect(htmlDecode("&#128512;")).toBe("😀")
  })

  it("round-trips text through encode + decode", () => {
    const input = 'mix of <tags> "quotes" & ampersands\''
    expect(htmlDecode(htmlEncode(input))).toBe(input)
  })

  it("only decodes one level (no double-unescaping)", () => {
    expect(htmlDecode("&amp;amp;")).toBe("&amp;")
  })
})

describe("htmlEntityEncoderEngine", () => {
  it("encodes by default and reports replacement count", async () => {
    const result = await htmlEntityEncoderEngine.run({ input: "<b>&</b>" })
    expect(result.output.text).toBe("&lt;b&gt;&amp;&lt;/b&gt;")
    expect(result.output.replacements).toBe(5)
  })

  it("decodes entities back to characters", async () => {
    const result = await htmlEntityEncoderEngine.run({
      input: "&lt;b&gt;&amp;&lt;/b&gt;",
      mode: "decode",
    })
    expect(result.output.text).toBe("<b>&</b>")
    expect(result.output.replacements).toBe(5)
  })

  it("reports zero replacements for plain text", async () => {
    const result = await htmlEntityEncoderEngine.run({ input: "plain text" })
    expect(result.output.replacements).toBe(0)
  })

  it("rejects empty input", async () => {
    const error = await htmlEntityEncoderEngine.run({ input: " " }).catch((e: unknown) => e)
    expect(error).toBeDefined()
  })
})
