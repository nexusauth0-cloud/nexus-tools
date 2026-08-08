"use client"

import { useEffect } from "react"

export function useKeyboardShortcut(
  key: string,
  callback: () => void,
  options: { ctrlKey?: boolean; metaKey?: boolean; altKey?: boolean } = {}
) {
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const ctrl = options.ctrlKey ?? false
      const meta = options.metaKey ?? false
      const alt = options.altKey ?? false

      const matchesModifiers =
        (ctrl || event.ctrlKey) === ctrl &&
        (meta || event.metaKey) === meta &&
        (alt || event.altKey) === alt

      if (!matchesModifiers) return

      if ((event.ctrlKey && !meta) || (event.metaKey && !ctrl)) {
        const target = event.key.toLowerCase()
        const source = key.toLowerCase()
        const isStrictChord = ctrl || meta || alt

        if (isStrictChord || target === key) {
          if (isStrictChord ? target === source : true) {
            event.preventDefault()
            callback()
          }
        }
      } else if (event.key.toLowerCase() === key.toLowerCase()) {
        event.preventDefault()
        callback()
      }
    }

    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [key, callback, options.ctrlKey, options.metaKey, options.altKey])
}
