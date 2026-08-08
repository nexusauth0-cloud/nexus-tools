import { z } from "zod"
import { createToolEngine, summarize, textField, ToolExecutionError } from "@/lib/tool-engine"
import { urlDecode, urlEncode } from "@/lib/encoding"
import { byteSize } from "@/lib/json"

/**
 * URL engine — percent-encode/decode built on shared helpers. Decoding
 * treats `+` as a space so form-encoded query strings round-trip.
 */

export type UrlMode = "encode" | "decode"

export interface UrlInput {
  input: string
  mode: UrlMode
}

export interface UrlOutput {
  mode: UrlMode
  text: string
  bytes: number
}

const schema = z.object({
  input: textField({ min: 1, max: undefined }),
  mode: z.enum(["encode", "decode"]).default("encode"),
})

export const urlEncoderEngine = createToolEngine<typeof schema, UrlOutput>({
  toolId: "url-encoder",
  schema,
  process: (value) => {
    const text = value.mode === "encode" ? urlEncode(value.input) : safelyDecode(value.input)
    return { mode: value.mode, text, bytes: byteSize(text) }
  },
  summarize: {
    input: (value) => summarize(value.input),
    output: (value) => `${value.text.length} characters (URL ${value.mode})`,
  },
})

function safelyDecode(value: string): string {
  try {
    return urlDecode(value)
  } catch (error) {
    throw new ToolExecutionError("VALIDATION", (error as Error).message)
  }
}
