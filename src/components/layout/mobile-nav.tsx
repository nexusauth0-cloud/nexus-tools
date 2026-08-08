"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { toast } from "sonner"
import { ArrowRight, ChevronDown } from "lucide-react"
import { cn } from "@/lib"
import { Logo } from "@/components/design-system/logo"
import { ThemeToggle } from "./theme-toggle"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetDescription,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { getNavCategories } from "@/lib/platform"
import { resolveIcon } from "@/lib/icons"

interface MobileNavProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function MobileNav({ open, onOpenChange }: MobileNavProps) {
  const pathname = usePathname()
  const categoryFlyout = getNavCategories(6)

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href))

  const handleSignIn = () => {
    onOpenChange(false)
    toast.info("Sign-in is coming in the next milestone.", {
      description: "NEXUS Tools accounts are right around the corner.",
    })
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger className="hidden" aria-hidden="true" />
      <SheetContent side="right" className="flex flex-col p-0">
        <SheetHeader className="border-b border-border px-5 py-4">
          <SheetTitle className="sr-only">Navigation menu</SheetTitle>
          <SheetDescription className="sr-only">
            Browse tools, categories, pricing, and the blog.
          </SheetDescription>
          <div className="flex items-center justify-between">
            <Logo />
            <ThemeToggle />
          </div>
        </SheetHeader>

        <div className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-4">
          <nav aria-label="Mobile" className="flex flex-col gap-1">
            {[
              { href: "/tools", label: "All Tools" },
              { href: "/categories", label: "Categories" },
              { href: "/pricing", label: "Pricing" },
              { href: "/blog", label: "Blog" },
            ].map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                onClick={() => onOpenChange(false)}
                className={cn(
                  "flex h-11 items-center justify-between rounded-lg px-3 text-[15px] font-medium text-foreground transition-colors hover:bg-surface",
                  isActive(href) && "bg-surface text-gold"
                )}
                aria-current={isActive(href) ? "page" : undefined}
              >
                {label}
                <ArrowRight className="size-4 text-muted-foreground" aria-hidden="true" />
              </Link>
            ))}
          </nav>

          <Separator className="my-4" />

          <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Popular categories
          </p>
          <nav aria-label="Mobile categories" className="flex flex-col gap-0.5">
            {categoryFlyout.map((item) => {
              const Icon = resolveIcon(item.icon)
              return (
                <Link
                  key={item.id}
                  href={`/categories/${item.id}`}
                  onClick={() => onOpenChange(false)}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-surface"
                >
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-surface">
                    <Icon className="size-4 text-gold" aria-hidden="true" />
                  </span>
                  <span className="flex min-w-0 flex-col">
                    <span className="text-sm font-medium text-foreground">{item.name}</span>
                    <span className="truncate text-xs text-muted-foreground">
                      {item.description}
                    </span>
                  </span>
                  <ChevronDown
                    className="ml-auto size-4 -rotate-90 text-muted-foreground"
                    aria-hidden="true"
                  />
                </Link>
              )
            })}
          </nav>
        </div>

        <div className="border-t border-border p-4">
          <Button className="w-full" size="lg" onClick={handleSignIn}>
            Sign in
            <ArrowRight className="size-4" aria-hidden="true" />
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
