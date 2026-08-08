"use client"

import { useEffect, useRef, useState } from "react"
import { useInView, useReducedMotion } from "framer-motion"
import { clamp } from "@/lib/utils"

interface UseCountUpOptions {
  target: number
  duration?: number
  decimals?: number
  enabled?: boolean
}

export function useCountUp({
  target,
  duration = 1600,
  decimals = 0,
  enabled = true,
}: UseCountUpOptions) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: "-80px" })
  const reduceMotion = useReducedMotion()
  const [value, setValue] = useState(0)

  useEffect(() => {
    if (!inView || !enabled || reduceMotion) return

    let frame = 0
    const start = performance.now()

    const tick = (now: number) => {
      const progress = clamp((now - start) / duration, 0, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(target * eased)
      if (progress < 1) {
        frame = requestAnimationFrame(tick)
      }
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [inView, enabled, target, duration, reduceMotion])

  const displayValue = !inView || !enabled ? 0 : reduceMotion ? target : value

  const formatted = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(displayValue)

  return { ref, value: formatted, inView }
}
