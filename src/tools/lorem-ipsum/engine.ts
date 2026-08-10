import { z } from "zod"
import { createToolEngine, integerField, type ToolSummarizer } from "@/lib/tool-engine"
import {
  generateLorem,
  LOREM_DEFAULT_SEED,
  LOREM_MAX,
  type LoremFormat,
  type LoremMode,
} from "@/lib/text/lorem"

/**
 * Lorem Ipsum Generator — deterministic placeholder text built on a
 * seeded mulberry32 PRNG. The same seed always produces the same output.
 * Quantities beyond the documented per-mode maximums are rejected at
 * validation time; HTML output contains no user input by construction.
 */

export const LOREM_MODES = ["paragraphs", "sentences", "words"] as const
export const LOREM_FORMATS = ["plain", "markdown", "html"] as const

export interface LoremIpsumInput {
  mode: LoremMode
  quantity: number
  format: LoremFormat
  startWithClassic: boolean
  seed: number
}

export interface LoremIpsumOutput {
  text: string
  wordCount: number
  seed: number
}

const schema = z
  .object({
    mode: z.enum(LOREM_MODES).default("paragraphs"),
    quantity: integerField(1, Math.max(...Object.values(LOREM_MAX))).default(5),
    format: z.enum(LOREM_FORMATS).default("plain"),
    startWithClassic: z.boolean().default(true),
    seed: integerField(0).default(LOREM_DEFAULT_SEED),
  })
  .superRefine((value, ctx) => {
    const max = LOREM_MAX[value.mode]
    if (value.quantity > max) {
      ctx.addIssue({
        code: "custom",
        path: ["quantity"],
        message: `Maximum of ${max} ${value.mode} per run.`,
      })
    }
  })

export const loremIpsumSummarize: ToolSummarizer<LoremIpsumInput, LoremIpsumOutput> = {
  input: (value) => `${value.quantity} ${value.mode} (${value.format})`,
  output: (value) => `${value.wordCount} words`,
}

export const loremIpsumEngine = createToolEngine<typeof schema, LoremIpsumOutput>({
  toolId: "lorem-ipsum",
  schema,
  process: ({ mode, quantity, format, startWithClassic, seed }) => {
    const result = generateLorem({ mode, quantity, format, startWithClassic, seed })
    return { text: result.text, wordCount: result.wordCount, seed: result.seed }
  },
  summarize: loremIpsumSummarize,
})
