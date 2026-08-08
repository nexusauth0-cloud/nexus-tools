import { z } from "zod"
import { createToolEngine, summarize, textField } from "@/lib/tool-engine"
import { htmlDecode, htmlEncode } from "@/lib/encoding"
import { byteSize } from "@/lib/json"

/**
 * HTML entity engine — escape/un-escape the five HTML-significant
 * characters on top of the shared encoding helpers.
 */

export type HtmlMode = "encode" | "decode"

export interface HtmlInput {
  input: string
  mode: HtmlMode
}

export interface HtmlOutput {
  mode: HtmlMode
  text: string
  bytes: number
  replacements: number
}

const schema = z.object({
  input: textField({ min: 1, max: undefined }),
  mode: z.enum(["encode", "decode"]).default("encode"),
})

export const htmlEntityEncoderEngine = createToolEngine<typeof schema, HtmlOutput>({
  toolId: "html-entity-encoder",
  schema,
  process: (value) => {
    const text = value.mode === "encode" ? htmlEncode(value.input) : htmlDecode(value.input)
    return {
      mode: value.mode,
      text,
      bytes: byteSize(text),
      replacements:
        value.mode === "encode" ? countEncodable(value.input) : countEntityRefs(value.input),
    }
  },
  summarize: {
    input: (value) => summarize(value.input),
    output: (value) => `${value.replacements} replacements (HTML ${value.mode})`,
  },
})

function countEncodable(text: string): number {
  return (text.match(/[&<>"']/g) ?? []).length
}

function countEntityRefs(text: string): number {
  return (text.match(/&#(?:x[0-9a-f]+|\d+);|&(?:amp|lt|gt|quot|apos);/gi) ?? []).length
}
