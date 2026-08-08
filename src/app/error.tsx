"use client"

import { RotateCcw, TriangleAlert } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="container-site flex flex-1 flex-col items-center justify-center gap-6 py-24 text-center">
      <div className="flex size-14 items-center justify-center rounded-2xl border border-destructive/25 bg-destructive/10">
        <TriangleAlert className="size-6 text-destructive" aria-hidden="true" />
      </div>
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Something went sideways
        </h1>
        <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
          An unexpected error occurred{error.digest ? ` (${error.digest})` : ""}. Your data never
          leaves your device — try reloading the page.
        </p>
      </div>
      <Button onClick={reset}>
        <RotateCcw className="size-4" aria-hidden="true" />
        Try again
      </Button>
    </div>
  )
}
