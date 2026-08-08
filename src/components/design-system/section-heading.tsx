import * as React from "react"
import { cn } from "@/lib/utils"
import { Reveal } from "./motion"

interface SectionHeadingProps {
  eyebrow?: React.ReactNode
  title: React.ReactNode
  description?: React.ReactNode
  align?: "left" | "center"
  className?: string
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
  className,
}: SectionHeadingProps) {
  return (
    <Reveal
      className={cn(
        "flex max-w-2xl flex-col gap-4",
        align === "center" && "mx-auto items-center text-center",
        className
      )}
    >
      {eyebrow && (
        <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-gold">
          <span
            aria-hidden="true"
            className="h-px w-6 bg-gradient-to-r from-transparent to-gold/70"
          />
          {eyebrow}
          {align === "center" && (
            <span
              aria-hidden="true"
              className="h-px w-6 bg-gradient-to-l from-transparent to-gold/70"
            />
          )}
        </span>
      )}
      <h2 className="text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
        {title}
      </h2>
      {description && (
        <p className="text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
          {description}
        </p>
      )}
    </Reveal>
  )
}

export function Section({
  id,
  className,
  children,
}: {
  id?: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <section id={id} className={cn("py-16 sm:py-24", className)}>
      <div className="container-site">{children}</div>
    </section>
  )
}
