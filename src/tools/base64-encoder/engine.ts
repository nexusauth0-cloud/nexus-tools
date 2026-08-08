import { z } from "zod"
import { createToolEngine, summarize, textField, ToolExecutionError } from "@/lib/tool-engine"
import { base64Decode, base64Encode } from "@/lib/encoding"
import { byteSize } from "@/lib/json"

/**
 * Base64 engine — Unicode-safe encode/decode built on shared encoding
 * helpers. Encoding always round-trips UTF-8 text correctly.
 */

export type Base64Mode = "encode" | "decode"

export interface Base64Input {
  input: string
  mode: Base64Mode
}

export interface Base64Output {
  mode: Base64Mode
  text: string
  bytes: number
}

const schema = z.object({
  input: textField({ min: 1, max: undefined }),
  mode: z.enum(["encode", "decode"]).default("encode"),
})

export const base64EncoderEngine = createToolEngine<typeof schema, Base64Output>({
  toolId: "base64-encoder",
  schema,
  process: (value) => {
    const text = value.mode === "encode" ? base64Encode(value.input) : safelyDecode(value.input)

    return { mode: value.mode, text, bytes: byteSize(text) }
  },
  summarize: {
    input: (value) => summarize(value.input),
    output: (value) => `${value.text.length} characters (base64 ${value.mode})`,
  },
})

function safelyDecode(value: string): string {
  try {
    return base64Decode(value)
  } catch (error) {
    throw new ToolExecutionError("VALIDATION", (error as Error).message)
  }
}
