import { z } from "zod"
import {
  createToolEngine,
  optionalTextField,
  summarize,
  type ToolSummarizer,
} from "@/lib/tool-engine"
import { diffLines, type DiffResult } from "@/lib/text/diff"

/**
 * Text Diff Checker — line-by-line diff built on a deterministic
 * Myers O(ND) implementation (see src/lib/text/diff.ts).
 */

export const TEXT_DIFF_MAX_CHARS = 300_000

export interface TextDiffInput {
  original: string
  modified: string
}

export interface TextDiffOutput {
  diff: DiffResult
}

export const textDiffSummarize: ToolSummarizer<TextDiffInput, TextDiffOutput> = {
  input: (value) => summarize(value.original),
  output: (value) =>
    `${value.diff.added} added · ${value.diff.removed} removed · ${value.diff.unchanged} unchanged`,
}

const schema = z.object({
  original: optionalTextField({ max: TEXT_DIFF_MAX_CHARS }),
  modified: optionalTextField({ max: TEXT_DIFF_MAX_CHARS }),
})

export const textDiffEngine = createToolEngine<typeof schema, TextDiffOutput>({
  toolId: "text-differ",
  schema,
  process: ({ original, modified }) => ({ diff: diffLines(original, modified) }),
  summarize: textDiffSummarize,
})
