"use client"

import { useState } from "react"
import { Check, Copy, Share2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"

export function ShareButtons({ title, path }: { title: string; path: string }) {
  const [copied, setCopied] = useState(false)
  const url = typeof window !== "undefined" ? `${window.location.origin}${path}` : path

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error("Could not copy the link.", {
        description: "Copy the address from your browser instead.",
      })
    }
  }

  const handleShare = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title, url })
        return
      } catch {
        // User cancelled the share sheet — fall through to copy.
      }
    }
    await handleCopy()
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button variant="outline" size="sm" onClick={handleShare}>
        <Share2 className="size-3.5" aria-hidden="true" />
        Share
      </Button>
      <Button variant="ghost" size="sm" onClick={handleCopy} aria-label="Copy link to clipboard">
        {copied ? (
          <Check className="size-3.5 text-success" aria-hidden="true" />
        ) : (
          <Copy className="size-3.5" aria-hidden="true" />
        )}
        {copied ? "Copied" : "Copy link"}
      </Button>
    </div>
  )
}
