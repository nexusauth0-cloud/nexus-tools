"use client"

import { RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ResetButtonProps {
  onClick: () => void
  label?: string
  disabled?: boolean
  className?: string
}

/** Clears a tool's input and/or result back to its initial state. */
export function ResetButton({ onClick, label = "Reset", disabled, className }: ResetButtonProps) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={onClick}
      disabled={disabled}
      className={className}
      aria-label={label}
    >
      <RotateCcw />
      {label}
    </Button>
  )
}
