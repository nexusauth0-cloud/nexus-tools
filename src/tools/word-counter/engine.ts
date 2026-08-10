import { z } from "zod"
import {
  createToolEngine,
  optionalTextField,
  summarize,
  type ToolSummarizer,
} from "@/lib/tool-engine"
import {
  analyzeText,
  formatDuration,
  readingTimeSeconds,
  speakingTimeSeconds,
  type TextStats,
} from "@/lib/text/stats"

/**
 * Word & Character Counter — live Unicode-aware text statistics.
 *
 * Counting rules live in src/lib/text/stats.ts and are documented there
 * and in the tool UI. Empty input is valid and returns zeroed stats.
 */

export const WORD_COUNTER_MAX_CHARS = 1_000_000

export interface WordCounterOutput {
  stats: TextStats
  /** Human display-ready estimate, e.g. "2 min 5 s". */
  readingTime: string
  speakingTime: string
}

export const wordCounterSummarize: ToolSummarizer<{ input: string }, WordCounterOutput> = {
  input: (value) => summarize(value.input),
  output: (value) => `${value.stats.words} words · ${value.stats.characters} characters`,
}

const schema = z.object({
  input: optionalTextField({ max: WORD_COUNTER_MAX_CHARS }),
})

export const wordCounterEngine = createToolEngine<typeof schema, WordCounterOutput>({
  toolId: "word-counter",
  schema,
  process: ({ input }) => {
    const stats = analyzeText(input)
    return {
      stats,
      readingTime: formatDuration(readingTimeSeconds(stats.words)),
      speakingTime: formatDuration(speakingTimeSeconds(stats.words)),
    }
  },
  summarize: wordCounterSummarize,
})
