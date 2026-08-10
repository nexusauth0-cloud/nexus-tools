import type { DiffResult } from "@/lib/text/diff"
import { cn } from "@/lib/utils"

/**
 * Line-by-line diff view: deletions in red with "−", insertions in green
 * with "+", unchanged lines dimmed. Rendered from the engine's plain
 * DiffResult — never from parsed or executed content.
 */
export function DiffViewer({ diff }: { diff: DiffResult }) {
  return (
    <div
      className="max-h-96 overflow-auto rounded-lg border border-border bg-background/60 font-mono text-[13px] leading-relaxed"
      role="list"
      aria-label="Diff output"
    >
      {diff.ops.length === 0 ? (
        <p className="p-4 text-sm text-muted-foreground">
          Nothing to compare — paste text on both sides to see a diff.
        </p>
      ) : (
        diff.ops.map((op, index) => (
          <div
            key={index}
            role="listitem"
            className={cn(
              "flex items-start gap-3 border-b border-border/40 px-3 py-1 last:border-b-0 whitespace-pre-wrap break-words",
              op.type === "insert" && "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
              op.type === "delete" && "bg-red-500/10 text-red-600 dark:text-red-300",
              op.type === "equal" && "text-muted-foreground"
            )}
          >
            <span
              aria-hidden
              className={cn(
                "select-none shrink-0 w-4 text-center",
                op.type === "insert" && "text-emerald-600 dark:text-emerald-400",
                op.type === "delete" && "text-red-500 dark:text-red-400",
                op.type === "equal" && "text-muted-foreground/60"
              )}
            >
              {op.type === "insert" ? "+" : op.type === "delete" ? "−" : "·"}
            </span>
            <span className="min-w-0">{op.line === "" ? " " : op.line}</span>
          </div>
        ))
      )}
    </div>
  )
}
