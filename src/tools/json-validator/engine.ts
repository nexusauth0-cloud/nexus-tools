import { z } from "zod"
import { createToolEngine, summarize, textField, ToolExecutionError } from "@/lib/tool-engine"
import { byteSize, countJsonEntries, parseJsonWithLocation } from "@/lib/json"

/**
 * JSON Validator engine — the pure core of the tool. Shared JSON parsing
 * (with line/column reporting) lives in `@/lib/json` so error copy stays
 * identical to the JSON Formatter.
 */

export interface JsonValidatorOutput {
  valid: true
  text: string
  bytes: number
  entries: number
}

const schema = z.object({
  json: textField({ min: 1, max: undefined }),
})

export const jsonValidatorEngine = createToolEngine<typeof schema, JsonValidatorOutput>({
  toolId: "json-validator",
  schema,
  process: (input) => {
    const parsed = parseJsonWithLocation(input.json)
    if (!parsed.ok) throw new ToolExecutionError("VALIDATION", parsed.message)

    const text = input.json.trim()
    return {
      valid: true,
      text,
      bytes: byteSize(text),
      entries: countJsonEntries(parsed.value),
    }
  },
  summarize: {
    input: (value) => summarize(value.json),
    output: (value) => `Valid JSON — ${value.entries} top-level entries`,
  },
})
