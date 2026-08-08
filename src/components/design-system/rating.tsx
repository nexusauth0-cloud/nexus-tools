import * as React from "react"
import { Star, StarHalf } from "lucide-react"
import { cn } from "@/lib/utils"

export function Rating({ value, className }: { value: number; className?: string }) {
  const full = Math.floor(value)
  const half = value - full >= 0.5

  return (
    <span
      className={cn("inline-flex items-center gap-0.5 text-gold", className)}
      role="img"
      aria-label={`Rated ${value} out of 5`}
    >
      {Array.from({ length: 5 }, (_, index) => {
        if (index < full) {
          return <Star key={index} className="size-3.5 fill-current" aria-hidden="true" />
        }
        if (index === full && half) {
          return (
            <span key={index} className="relative inline-flex">
              <Star className="size-3.5 text-border" aria-hidden="true" />
              <StarHalf className="absolute inset-0 size-3.5 fill-current" aria-hidden="true" />
            </span>
          )
        }
        return <Star key={index} className="size-3.5 text-border" aria-hidden="true" />
      })}
      <span className="ml-1 text-xs font-medium tabular-nums text-muted-foreground">
        {value.toFixed(1)}
      </span>
    </span>
  )
}
