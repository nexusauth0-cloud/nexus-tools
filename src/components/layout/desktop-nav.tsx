"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib"
import { getNavCategories } from "@/lib/platform"
import { resolveIcon } from "@/lib/icons"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function DesktopNav() {
  const pathname = usePathname()
  const categoryFlyout = getNavCategories(6)

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href))

  return (
    <nav aria-label="Primary" className="hidden items-center gap-1 md:flex">
      <DropdownMenu>
        <DropdownMenuTrigger
          className={cn(
            "inline-flex h-9 select-none items-center gap-1 rounded-lg px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-surface hover:text-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring",
            (isActive("/tools") || isActive("/categories")) && "text-foreground"
          )}
        >
          Tools
          <ChevronDown className="size-3.5 opacity-60" aria-hidden="true" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-72 p-1.5">
          <DropdownMenuLabel className="px-2 pt-1.5">Browse categories</DropdownMenuLabel>
          <div className="grid grid-cols-1 gap-0.5">
            {categoryFlyout.map((item) => {
              const Icon = resolveIcon(item.icon)
              return (
                <DropdownMenuItem key={item.id} asChild>
                  <Link href={`/categories/${item.id}`} className="items-start gap-3 py-2">
                    <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-surface">
                      <Icon className="size-3.5 text-gold" aria-hidden="true" />
                    </span>
                    <span className="flex min-w-0 flex-col">
                      <span className="text-sm font-medium text-foreground">{item.name}</span>
                      <span className="text-xs text-muted-foreground">{item.description}</span>
                    </span>
                  </Link>
                </DropdownMenuItem>
              )
            })}
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/tools" className="justify-center font-medium text-gold">
              View all 55 tools
            </Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {[
        { href: "/pricing", label: "Pricing" },
        { href: "/blog", label: "Blog" },
      ].map(({ href, label }) => (
        <Link
          key={href}
          href={href}
          className={cn(
            "inline-flex h-9 items-center rounded-lg px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-surface hover:text-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring",
            isActive(href) && "text-foreground"
          )}
          aria-current={isActive(href) ? "page" : undefined}
        >
          {label}
        </Link>
      ))}
    </nav>
  )
}
