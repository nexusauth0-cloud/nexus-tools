import type { TextStats } from "@/lib/text/stats"
import { cn } from "@/lib/utils"

const CELLS: ReadonlyArray<readonly [keyof TextStats, string]> = [
  ["characters", "Characters"],
  ["words", "Words"],
  ["sentences", "Sentences"],
  ["paragraphs", "Paragraphs"],
  ["lines", "Lines"],
  ["whitespace", "Whitespace"],
  ["bytes", "Bytes (UTF-8)"],
]

/**
 * Grid of live text statistics shared by the word counter and the
 * markdown previewer (labels match the rules documented in
 * src/lib/text/stats.ts).
 */
export function TextStats({ stats, className }: { stats: TextStats; className?: string }) {
  return (
    <dl className={cn("grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4", className)}>
      {CELLS.map(([key, label]) => (
        <div key={key} className="rounded-lg border border-border bg-background/60 p-3">
          <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
          <dd className="mt-1 text-xl font-semibold tabular-nums text-foreground">
            {stats[key].toLocaleString()}
          </dd>
        </div>
      ))}
    </dl>
  )
}
