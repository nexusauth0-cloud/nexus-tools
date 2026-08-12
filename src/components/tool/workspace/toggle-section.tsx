"use client"

import * as React from "react"

/**
 * Small collapsible section for secondary output detail (per-tool
 * breakdowns, extra conversions, notes). Accessible disclosure widget.
 */
export function ToggleSection({
  title,
  defaultOpen = false,
  children,
}: {
  title: string
  defaultOpen?: boolean
  children: React.ReactNode
}) {
  const [open, setOpen] = React.useState(defaultOpen)
  const panelId = React.useId()
  return (
    <section className="rounded-lg border border-border bg-card/50">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls={panelId}
        className="flex w-full items-center justify-between px-3 py-2 text-sm font-medium text-foreground"
      >
        <span>{title}</span>
        <span aria-hidden="true" className="text-muted-foreground">
          {open ? "−" : "+"}
        </span>
      </button>
      {open ? (
        <div id={panelId} className="border-t border-border px-3 py-3">
          {children}
        </div>
      ) : null}
    </section>
  )
}