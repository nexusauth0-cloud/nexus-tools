import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { cn } from "@/lib"
import type { ToolCategory } from "@/shared/category"
import { resolveIcon } from "@/lib/icons"
import { formatToolCountFor } from "@/lib/platform"
import { StaggerItem } from "./motion"

export function CategoryCard({ category }: { category: ToolCategory }) {
  const Icon = resolveIcon(category.icon)
  const count = formatToolCountFor(category.id)

  return (
    <StaggerItem>
      <Link
        href={`/categories/${category.id}`}
        className={cn(
          "group relative flex h-full flex-col gap-4 overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-card transition-all duration-300",
          "hover:-translate-y-1 hover:border-primary/30 hover:bg-surface hover:shadow-card-hover focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
        )}
      >
        <div className="flex items-center justify-between">
          <div
            className={cn(
              "flex size-11 items-center justify-center rounded-xl bg-gradient-to-br shadow-sm",
              category.gradient
            )}
          >
            {/* eslint-disable-next-line react-hooks/static-components -- data-driven icon registry (static module map) */}
            <Icon className={cn("size-5", category.tint)} aria-hidden="true" />
          </div>
          <span className="text-xs font-medium tabular-nums text-muted-foreground">{count}</span>
        </div>

        <div className="flex flex-1 flex-col gap-1.5">
          <h3 className="text-[15px] font-semibold tracking-tight text-foreground">
            {category.name}
          </h3>
          <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
            {category.description}
          </p>
        </div>

        <div className="flex items-center gap-1 text-xs font-medium text-gold opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          Explore
          <ArrowRight
            className="size-3.5 transition-transform duration-300 group-hover:translate-x-0.5"
            aria-hidden="true"
          />
        </div>
      </Link>
    </StaggerItem>
  )
}
