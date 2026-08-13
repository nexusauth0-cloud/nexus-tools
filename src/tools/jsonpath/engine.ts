import { z } from "zod"
import { createToolEngine, ToolExecutionError } from "@/lib/tool-engine"
import {
  checkJsonDepth,
  JSONPATH_MAX_DEPTH,
  JSONPATH_MAX_JSON_CHARS,
  queryJsonPath,
  JsonPathError,
} from "@/lib/jsonpath"
import { summarize } from "@/lib/tool-engine"

/**
 * JSONPath Tester engine.
 *
 * Documents raw JSON is parsed locally; the query runs against a dedicated
 * evaluator — no eval/Function anywhere. `__proto__`/`constructor`/
 * `prototype` stay ordinary data (read-only own-property access, no object
 * mutation). Limits (JSON size, expression length, depth, results, visits)
 * fail loudly with explanations — results are never silently incomplete.
 */

const schema = z.object({
  json: z
    .string()
    .min(1, "Paste a JSON document to query.")
    .max(
      JSONPATH_MAX_JSON_CHARS,
      `JSON document is too large (max ${JSONPATH_MAX_JSON_CHARS} characters).`
    ),
  expression: z
    .string()
    .min(1, "Enter a JSONPath expression.")
    .max(400, "Expression is too long (max 400 characters)."),
})

export interface JsonPathMatchView {
  path: string
  value: unknown
  /** JSON representation — displayed distinctly from raw string values. */
  json: string
  /** Whether the value is a JSON string (displayed quoted). */
  isString: boolean
}

export interface JsonPathTesterOutput {
  ok: boolean
  matches: JsonPathMatchView[]
  count: number
  /** True when the matched values include objects/arrays (shown paginated). */
  hasStructuredValues: boolean
  documentShape: string
}

function describeDocument(value: unknown): string {
  if (Array.isArray(value)) return `array with ${value.length} items`
  if (value !== null && typeof value === "object")
    return `object with ${Object.keys(value).length} keys`
  return "scalar value"
}

export const jsonPathTesterEngine = createToolEngine<typeof schema, JsonPathTesterOutput>({
  toolId: "jsonpath",
  schema,
  process: ({ json, expression }) => {
    let document: unknown
    try {
      document = JSON.parse(json)
    } catch (error) {
      throw new ToolExecutionError(
        "VALIDATION",
        `Invalid JSON: ${error instanceof Error ? error.message.split("\n")[0] : "could not parse."}`
      )
    }

    const depth = checkJsonDepth(document, JSONPATH_MAX_DEPTH)
    if (depth > JSONPATH_MAX_DEPTH) {
      throw new ToolExecutionError(
        "VALIDATION",
        `The JSON document is nested deeper than ${JSONPATH_MAX_DEPTH} levels, which this tool cannot process safely. Flatten the document and try again.`
      )
    }

    try {
      const result = queryJsonPath(document, expression)
      if (!result.ok) {
        throw new ToolExecutionError(
          "VALIDATION",
          result.error?.message ?? "Could not evaluate the expression."
        )
      }
      return {
        ok: true,
        matches: result.matches.map((match) => ({
          path: match.path,
          value: match.value,
          json: match.json,
          isString: typeof match.value === "string",
        })),
        count: result.matches.length,
        hasStructuredValues: result.matches.some(
          (match) => match.value !== null && typeof match.value === "object"
        ),
        documentShape: describeDocument(document),
      }
    } catch (error) {
      if (error instanceof JsonPathError) {
        throw new ToolExecutionError("VALIDATION", error.message)
      }
      throw error
    }
  },
  summarize: {
    input: (value) => summarize(value.expression, 60),
    output: (value) => `${value.count} ${value.count === 1 ? "match" : "matches"}`,
  },
})
