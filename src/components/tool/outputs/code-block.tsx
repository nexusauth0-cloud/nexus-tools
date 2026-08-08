"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface CodeBlockProps extends React.ComponentProps<"pre"> {
  /** Max height before the block scrolls internally. */
  maxHeight?: number | string
}

/**
 * Read-only formatted output. Keyboard-scrollable, wraps long lines, and
 * ships with a visual copy affordance (see CopyButton for the action).
 */
const CodeBlock = React.forwardRef<HTMLPreElement, CodeBlockProps>(
  ({ className, maxHeight = 320, ...props }, ref) => (
    <pre
      ref={ref}
      className={cn(
        "w-full overflow-auto rounded-lg border border-border bg-background/60 p-3 text-[13px] leading-relaxed text-foreground",
        className
      )}
      style={{ maxHeight }}
      {...props}
    />
  )
)
CodeBlock.displayName = "CodeBlock"

export { CodeBlock }
