"use client"

import { useEffect } from "react"
import { trackToolView } from "@/lib/analytics"
import { useRecentsStore } from "@/store/recents-store"

/**
 * Fire-and-forget client effect that records a tool visit for analytics
 * and the "recently used" strip. Mounted once per tool page.
 */
export function ToolViewTracker({ slug, title }: { slug: string; title: string }) {
  useEffect(() => {
    trackToolView({ slug, title })
    useRecentsStore.getState().push(slug)
  }, [slug, title])

  return null
}
