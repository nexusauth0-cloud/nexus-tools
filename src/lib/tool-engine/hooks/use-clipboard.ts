"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import { copyStatusMessage, copyText } from "../clipboard"

/**
 * Copy a string to the clipboard with transient UI feedback.
 * Renders a toast plus a `copied` flag for the CopyButton styling.
 */
export function useClipboard() {
  const [copied, setCopied] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
  }, [])

  const copy = useCallback(async (text: string): Promise<boolean> => {
    const result = await copyText(text)
    if (result.ok) {
      if (timer.current) clearTimeout(timer.current)
      setCopied(true)
      timer.current = setTimeout(() => setCopied(false), 2000)
      toast.success(copyStatusMessage(result))
    } else {
      toast.error(copyStatusMessage(result))
    }
    return result.ok
  }, [])

  const reset = useCallback(() => {
    setCopied(false)
  }, [])

  return { copy, copied, reset }
}
