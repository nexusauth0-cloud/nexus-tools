"use client"

import { cn } from "@/lib/utils"

interface QualitySliderProps {
  value: number
  onChange: (value: number) => void
  label?: string
  disabled?: boolean
  className?: string
}

/** Quality slider (1–100) with the current value shown numerically. */
export function QualitySlider({
  value,
  onChange,
  label = "Quality",
  disabled,
  className,
}: QualitySliderProps) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex items-center justify-between">
        <label htmlFor="quality-slider" className="text-sm font-medium text-foreground">
          {label}
        </label>
        <span className="text-xs tabular-nums text-muted-foreground">{value}%</span>
      </div>
      <input
        id="quality-slider"
        type="range"
        min={1}
        max={100}
        step={1}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(Number(event.target.value))}
        className="h-2 w-full cursor-pointer appearance-none rounded-full bg-surface-2 accent-primary disabled:cursor-not-allowed disabled:opacity-60"
        aria-valuetext={`${value}%`}
      />
    </div>
  )
}
