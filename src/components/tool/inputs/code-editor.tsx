"use client"

import * as React from "react"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

interface CodeEditorProps extends React.ComponentProps<typeof Textarea> {
  /** Accessible name for the editor region. */
  label?: string
  /** Optional live character count rendered under the field. */
  showCount?: boolean
}

/**
 * Shared code/text input. Monospace, spellcheck-free, keyboard-first —
 * the standard field every text-processing tool edits through.
 */
const CodeEditor = React.forwardRef<HTMLTextAreaElement, CodeEditorProps>(
  ({ className, label, showCount = false, spellCheck = false, ...props }, ref) => {
    const count = typeof props.value === "string" ? props.value.length : undefined
    return (
      <div className="flex flex-col gap-2">
        {label ? (
          <label className="text-sm font-medium text-foreground" htmlFor={props.id}>
            {label}
          </label>
        ) : null}
        <Textarea
          ref={ref}
          spellCheck={spellCheck}
          autoComplete="off"
          autoCapitalize="off"
          autoCorrect="off"
          className={cn("min-h-48 resize-y font-mono text-[13px] leading-relaxed", className)}
          {...props}
        />
        {showCount && count !== undefined ? (
          <p className="text-xs text-muted-foreground" aria-live="polite">
            {count.toLocaleString()} {count === 1 ? "character" : "characters"}
          </p>
        ) : null}
      </div>
    )
  }
)
CodeEditor.displayName = "CodeEditor"

export { CodeEditor }
