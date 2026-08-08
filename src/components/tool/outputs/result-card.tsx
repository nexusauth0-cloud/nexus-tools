"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface ResultCardProps {
  title?: string
  /** Header actions rendered to the right of the title (copy, export…). */
  actions?: React.ReactNode
  children: React.ReactNode
  className?: string
}

/**
 * Standard shell for a tool's result region — consistent title bar,
 * action slot, and content area across every engine-driven tool.
 */
export function ResultCard({ title = "Result", actions, children, className }: ResultCardProps) {
  return (
    <Card className={cn("h-fit", className)}>
      <CardHeader className="flex-row items-center justify-between space-y-0 gap-2 pb-3">
        <CardTitle className="text-base">{title}</CardTitle>
        {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
      </CardHeader>
      <CardContent className="pt-0">{children}</CardContent>
    </Card>
  )
}
