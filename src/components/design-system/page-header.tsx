import { cn } from "@/lib"
import { Reveal } from "./motion"

interface PageHeaderProps {
  eyebrow?: React.ReactNode
  title: React.ReactNode
  description?: React.ReactNode
  children?: React.ReactNode
  className?: string
}

export function PageHeader({ eyebrow, title, description, children, className }: PageHeaderProps) {
  return (
    <Reveal className={cn("flex flex-col gap-5", className)}>
      <div className="flex max-w-3xl flex-col gap-4">
        {eyebrow && (
          <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-gold">
            <span
              aria-hidden="true"
              className="h-px w-6 bg-gradient-to-r from-transparent to-gold/70"
            />
            {eyebrow}
          </span>
        )}
        <h1 className="text-balance text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
          {title}
        </h1>
        {description && (
          <p className="text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
            {description}
          </p>
        )}
      </div>
      {children}
    </Reveal>
  )
}
