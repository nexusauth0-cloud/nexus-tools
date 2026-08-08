import Link from "next/link"
import { ChevronRight } from "lucide-react"
import type { BreadcrumbItem } from "@/lib/platform/breadcrumbs"
import { cn } from "@/lib"

export function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
        {items.map((item, index) => {
          const isLast = index === items.length - 1
          return (
            <li key={item.path} className="inline-flex items-center gap-1.5">
              {isLast ? (
                <span aria-current="page" className="font-medium text-foreground">
                  {item.label}
                </span>
              ) : (
                <>
                  <Link
                    href={item.path}
                    className={cn(
                      "rounded-sm transition-colors hover:text-foreground",
                      "focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
                    )}
                  >
                    {item.label}
                  </Link>
                  <ChevronRight className="size-3.5 opacity-50" aria-hidden="true" />
                </>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
