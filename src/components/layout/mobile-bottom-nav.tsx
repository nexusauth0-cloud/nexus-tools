"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Compass, Search, Wrench } from "lucide-react"
import { cn } from "@/lib"
import { useSearchStore } from "@/store/search-store"

interface Tab {
  href: string
  label: string
  icon: typeof Wrench
  match: (path: string) => boolean
}

export type { Tab }

/**
 * The destinations shown in the mobile bottom navigation, exported for
 * testability. Each entry carries its real route and an active-state
 * matcher against the current pathname.
 */
export const mobileBottomTabs: Tab[] = [
  { href: "/", label: "Home", icon: Wrench, match: (path) => path === "/" },
  { href: "/tools", label: "Tools", icon: Compass, match: (path) => path.startsWith("/tools") },
]

/** True when a given pathname should mark a tab as the active page. */
export function isMobileTabActive(tab: Tab, pathname: string): boolean {
  return tab.match(pathname)
}

/**
 * Persistent bottom navigation for mobile widths.
 *
 * Provides fast access to Home and the Tools catalog, plus Search (opens
 * the command palette). Visible only below `md` so it never collides with
 * desktop navigation. Respects bottom safe-area insets and uses 44px+
 * touch targets, rendered as a native <nav> for correct semantics.
 */
export function MobileBottomNav() {
  const pathname = usePathname()
  const setOpen = useSearchStore((state) => state.setOpen)

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/85 backdrop-blur-md md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="mx-auto flex h-16 max-w-md items-stretch">
        {mobileBottomTabs.map(({ href, label, icon: Icon, match }) => {
          const active = isMobileTabActive({ href, label, icon: Icon, match }, pathname)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-lg text-[11px] font-medium transition-colors",
                "focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring",
                active
                  ? "text-gold"
                  : "text-muted-foreground hover:text-foreground active:scale-[0.98]"
              )}
              aria-current={active ? "page" : undefined}
            >
              <Icon
                className={cn("size-5 transition-colors", active && "fill-gold/20")}
                aria-hidden="true"
              />
              <span>{label}</span>
            </Link>
          )
        })}

        <button
          type="button"
          onClick={() => setOpen(true)}
          className={cn(
            "flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-lg text-[11px] font-medium transition-colors",
            "focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring",
            "text-muted-foreground hover:text-foreground active:scale-[0.98]"
          )}
          aria-label="Open search"
        >
          <Search className="size-5" aria-hidden="true" />
          <span>Search</span>
        </button>
      </div>
    </nav>
  )
}
