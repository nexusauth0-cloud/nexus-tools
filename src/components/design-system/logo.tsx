import Link from "next/link"
import { cn } from "@/lib/utils"

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" aria-hidden="true" className={cn("size-7", className)}>
      <path
        d="M16 2.5 27.5 9.25v13.5L16 29.5 4.5 22.75V9.25L16 2.5Z"
        stroke="currentColor"
        strokeWidth="2.25"
        strokeLinejoin="round"
        className="text-foreground"
      />
      <path
        d="M16 7.5 22.5 11.375v8.25L16 23.5l-6.5-3.875v-8.25L16 7.5Z"
        stroke="currentColor"
        strokeWidth="2.25"
        strokeLinejoin="round"
        className="text-gold"
      />
      <circle cx="16" cy="15.5" r="1.75" className="fill-gold" />
    </svg>
  )
}

export function Logo({
  className,
  href = "/",
  showWordmark = true,
}: {
  className?: string
  href?: string
  showWordmark?: boolean
}) {
  return (
    <Link
      href={href}
      aria-label="NEXUS Tools — Home"
      className={cn(
        "group inline-flex items-center gap-2.5 rounded-lg focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring",
        className
      )}
    >
      <LogoMark className="transition-transform duration-300 group-hover:rotate-[8deg]" />
      {showWordmark && (
        <span className="text-[17px] font-semibold tracking-[0.18em] text-foreground">NEXUS</span>
      )}
    </Link>
  )
}
