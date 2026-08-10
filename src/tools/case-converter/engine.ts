import { z } from "zod"
import {
  createToolEngine,
  optionalTextField,
  summarize,
  type ToolSummarizer,
} from "@/lib/tool-engine"
import { applyCase, CASE_MODES, splitWords, type CaseMode } from "@/lib/text/cases"

/**
 * Text Case Converter — Unicode-aware case conversion.
 *
 * Rules are documented in src/lib/text/cases.ts; only Unicode letters
 * are case-folded, everything else passes through unchanged.
 */

export const CASE_CONVERTER_MAX_CHARS = 500_000

export interface CaseConverterOutput {
  mode: CaseMode
  text: string
  /** Word count of the converted text (input words are preserved). */
  words: number
}

export const caseConverterSummarize: ToolSummarizer<
  { input: string; mode: CaseMode },
  CaseConverterOutput
> = {
  input: (value) => summarize(value.input),
  output: (value) => `${value.text.length} characters (${value.mode})`,
}

const schema = z.object({
  input: optionalTextField({ max: CASE_CONVERTER_MAX_CHARS }),
  mode: z.enum([...CASE_MODES] as [CaseMode, ...CaseMode[]]).default("lower"),
})

export const caseConverterEngine = createToolEngine<typeof schema, CaseConverterOutput>({
  toolId: "case-converter",
  schema,
  process: ({ input, mode }) => ({
    mode,
    text: applyCase(mode, input),
    words: splitWords(input).length,
  }),
  summarize: caseConverterSummarize,
})
