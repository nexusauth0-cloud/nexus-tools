import Link from "next/link"
import { ArrowRight, CalendarDays, Clock } from "lucide-react"
import { cn, formatDate } from "@/lib"
import type { BlogPost } from "@/shared"
import { StaggerItem } from "./motion"

export function BlogCard({ post }: { post: BlogPost }) {
  return (
    <StaggerItem className="h-full">
      <Link
        href={`/blog/${post.slug}`}
        className={cn(
          "group flex h-full flex-col gap-4 rounded-2xl border border-border bg-card p-5 shadow-card transition-all duration-300",
          "hover:-translate-y-1 hover:border-primary/30 hover:bg-surface hover:shadow-card-hover focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
        )}
      >
        <div
          className={cn(
            "flex h-32 items-end justify-between rounded-xl border border-border bg-gradient-to-br p-4",
            post.gradient
          )}
        >
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">
            {post.category}
          </span>
          <Clock className="size-4 text-muted-foreground" aria-hidden="true" />
        </div>

        <div className="flex flex-1 flex-col gap-2">
          <h3 className="line-clamp-2 text-[15px] font-semibold leading-snug tracking-tight text-foreground transition-colors group-hover:text-gold">
            {post.title}
          </h3>
          <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
            {post.excerpt}
          </p>
        </div>

        <div className="flex items-center justify-between border-t border-border pt-3.5 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays className="size-3.5" aria-hidden="true" />
            {formatDate(post.publishedAt)}
          </span>
          <span className="inline-flex items-center gap-1">
            {post.readTime} min read
            <ArrowRight
              className="size-3.5 text-gold opacity-0 transition-opacity duration-300 group-hover:opacity-100"
              aria-hidden="true"
            />
          </span>
        </div>
      </Link>
    </StaggerItem>
  )
}
