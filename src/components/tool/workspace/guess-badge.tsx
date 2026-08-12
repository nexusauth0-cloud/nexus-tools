"use client"

/**
 * Small colored chips for "guess" style results (e.g. the radix tool's
 * "guessed hex"), read as a sentence by screen readers.
 */
export function GuessBadge({ label, tone = "gold" }: { label: string; tone?: "gold" | "muted" }) {
  const tones = {
    gold: "border-gold/40 bg-gold/10 text-gold-foreground",
    muted: "border-border bg-muted/60 text-muted-foreground",
  } as const
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${tones[tone]}`}
    >
      <span aria-hidden="true" className="size-1.5 rounded-full bg-current opacity-70" />
      {label}
    </span>
  )
}