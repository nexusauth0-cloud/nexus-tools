import * as React from "react"
import { cn } from "@/lib/utils"

interface KbdProps extends React.HTMLAttributes<HTMLSpanElement> {
  size?: "sm" | "md"
}

export function Kbd({ className, size = "sm", ...props }: KbdProps) {
  return (
    <kbd
      className={cn(
        "inline-flex h-5 min-w-5 items-center justify-center rounded border border-border bg-surface px-1.5 font-mono text-[10px] font-medium text-muted-foreground shadow-[0_1px_0_rgb(0_0_0/0.3)]",
        size === "md" && "h-6 min-w-6 text-xs",
        className
      )}
      {...props}
    />
  )
}
