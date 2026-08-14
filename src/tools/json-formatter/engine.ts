import { z } from "zod"
import {
  createToolEngine,
  integerField,
  summarize,
  textField,
  ToolExecutionError,
} from "@/lib/tool-engine"
import {
  binarySafeStringify,
  byteSize,
  countJsonEntries,
  describeJsonCounts,
  parseStrictJson,
} from "@/lib/json"

/**
 * JSON Formatter engine — format, minify, validate, or binary-escape
 * strict JSON. All logic lives here (pure, testable); the React component
 * is a thin view over `jsonFormatterEngine`.
 */

export type JsonMode = "pretty" | "minified" | "validated" | "binary"

export interface JsonFormatterInput {
  json: string
  mode: JsonMode
  indent: number
}

export interface JsonFormatterOutput {
  mode: JsonMode
  text: string
  bytes: number
  entries: number
}

const schema = z.object({
  json: textField({ min: 1, max: undefined }),
  mode: z.enum(["pretty", "minified", "validated", "binary"]).default("pretty"),
  indent: integerField(2, 4).default(2),
})

export const jsonFormatterEngine = createToolEngine<typeof schema, JsonFormatterOutput>({
  toolId: "json-formatter",
  schema,
  process: (input) => {
    const parsed = parseStrictJson(input.json)
    if (!parsed.ok) throw new ToolExecutionError("VALIDATION", parsed.message)

    let text: string
    switch (input.mode) {
      case "minified":
        text = JSON.stringify(parsed.value)
        break
      case "pretty":
        text = JSON.stringify(parsed.value, null, input.indent)
        break
      case "validated":
        text = describeJsonCounts(parsed.value)
        break
      case "binary":
        text = binarySafeStringify(parsed.value)
        break
    }
    return {
      mode: input.mode,
      text,
      bytes: byteSize(text),
      entries: countJsonEntries(parsed.value),
    }
  },
  summarize: {
    input: (value) => summarize(value.json),
    output: (value) => `${value.mode} — ${value.bytes} bytes`,
  },
})
