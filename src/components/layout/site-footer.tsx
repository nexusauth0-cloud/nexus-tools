import Link from "next/link"
import { Heart } from "lucide-react"
import { cn, siteConfig } from "@/lib"
import { Logo } from "@/components/design-system/logo"
import { footerColumns, footerSocials } from "@/data/navigation"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"

export function SiteFooter() {
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-border bg-card/40">
      <div className="container-site py-14">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_2fr]">
          <div className="flex flex-col gap-5">
            <Logo />
            <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
              {siteConfig.description}
            </p>
            <div className="flex items-center gap-2">
              {footerSocials.map((social) => {
                const Icon = social.icon
                return (
                  <Button
                    key={social.label}
                    variant="outline"
                    size="icon"
                    asChild
                    aria-label={social.label}
                  >
                    <a href={social.href} target="_blank" rel="noopener noreferrer">
                      <Icon className="size-4" aria-hidden="true" />
                    </a>
                  </Button>
                )
              })}
              <span className="ml-2 inline-flex items-center gap-2 rounded-full border border-success/25 bg-success/10 px-3 py-1 text-xs font-medium text-success">
                <span className="relative flex size-1.5" aria-hidden="true">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-60" />
                  <span className="relative inline-flex size-1.5 rounded-full bg-success" />
                </span>
                All systems operational
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            {footerColumns.map((column) => (
              <nav key={column.title} aria-label={column.title}>
                <h3 className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  {column.title}
                </h3>
                <ul className="flex flex-col gap-2.5">
                  {column.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        {...(link.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                        className={cn(
                          "text-sm text-muted-foreground transition-colors hover:text-foreground",
                          "focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
                        )}
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
        </div>

        <Separator className="my-10" />

        <div className="flex flex-col items-center justify-between gap-4 text-xs text-muted-foreground sm:flex-row">
          <p>
            © {year} {siteConfig.name}. All rights reserved.
          </p>
          <p className="inline-flex items-center gap-1.5">
            Built with
            <Heart className="size-3.5 fill-gold text-gold" aria-hidden="true" />
            for a faster, private web
          </p>
        </div>
      </div>
    </footer>
  )
}
