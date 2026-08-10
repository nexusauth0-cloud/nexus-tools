import { z } from "zod"
import {
  createToolEngine,
  optionalTextField,
  summarize,
  type ToolSummarizer,
} from "@/lib/tool-engine"
import { analyzeText, type TextStats } from "@/lib/text/stats"
import { markdownToHtml } from "@/lib/text/markdown"

/**
 * Markdown Previewer — renders a safe subset of Markdown to HTML.
 *
 * The renderer (src/lib/text/markdown.ts) HTML-escapes every input
 * character by construction and output is only ever committed via the
 * preview iframe/DOM — never executed as script. User input is bounded
 * here; output size grows at most linearly with input.
 */

export const MARKDOWN_MAX_CHARS = 400_000

export interface MarkdownPreviewOutput {
  html: string
  stats: TextStats
}

export const markdownPreviewSummarize: ToolSummarizer<{ input: string }, MarkdownPreviewOutput> = {
  input: (value) => summarize(value.input),
  output: (value) => `${value.html.length} characters of rendered HTML`,
}

const schema = z.object({
  input: optionalTextField({ max: MARKDOWN_MAX_CHARS }),
})

export const markdownPreviewEngine = createToolEngine<typeof schema, MarkdownPreviewOutput>({
  toolId: "markdown-preview",
  schema,
  process: ({ input }) => {
    const html = markdownToHtml(input)
    const stats = analyzeText(input)
    return { html, stats }
  },
  summarize: markdownPreviewSummarize,
})
