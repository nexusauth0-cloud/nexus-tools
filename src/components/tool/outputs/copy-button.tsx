"use client"

import * as React from "react"
import { Check, Copy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useClipboard } from "@/lib/tool-engine"

interface CopyButtonProps {
  text: string
  label?: string
  className?: string
}

/**
 * Copy-to-clipboard with inline feedback (checkmark + toast).
 * Self-contained so tools never touch clipboard APIs directly.
 */
export function CopyButton({ text, label = "Copy", className }: CopyButtonProps) {
  const { copy, copied } = useClipboard()
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className={className}
      onClick={() => copy(text)}
      disabled={!text}
      aria-label={copied ? "Copied" : `Copy ${label.toLowerCase()}`}
    >
      {copied ? <Check className="text-emerald-500" /> : <Copy />}
      {copied ? "Copied" : label}
    </Button>
  )
}
