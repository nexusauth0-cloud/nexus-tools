"use client"

import Link from "next/link"
import { ArrowRight, FlaskConical, Star, Users } from "lucide-react"
import { motion } from "framer-motion"
import { cn, formatUsage } from "@/lib"
import type { ToolManifest } from "@/shared/manifest"
import { resolveIcon } from "@/lib/icons"
import { getCategoryMeta } from "@/data/category-meta"
import { useFavoritesStore } from "@/store/favorites-store"
import { Rating } from "./rating"
import { ToolStatusBadge } from "./tool-status-badge"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

interface ToolCardProps {
  tool: ToolManifest
  className?: string
  rank?: number
  showRank?: boolean
}

export function ToolCard({ tool, className, rank, showRank = false }: ToolCardProps) {
  const category = getCategoryMeta(tool.categoryId)
  const isFavorite = useFavoritesStore((state) => state.isFavorite(tool.slug))
  const toggleFavorite = useFavoritesStore((state) => state.toggleFavorite)
  const Icon = resolveIcon(tool.icon)

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      <Link
        href={`/tools/${tool.slug}`}
        className={cn(
          "group relative flex h-full flex-col gap-4 rounded-2xl border border-border bg-card p-5 shadow-card transition-all duration-300",
          "hover:-translate-y-1 hover:border-primary/30 hover:bg-surface hover:shadow-card-hover focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring",
          isFavorite && "border-gold/30"
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <div
            className={cn(
              "flex size-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br shadow-sm",
              tool.gradient
            )}
          >
            {/* eslint-disable-next-line react-hooks/static-components -- data-driven icon registry (static module map) */}
            <Icon className={cn("size-5", category.tint)} aria-hidden="true" />
          </div>

          {showRank && rank !== undefined && (
            <span className="font-mono text-sm font-semibold tabular-nums text-muted-foreground/60">
              {String(rank).padStart(2, "0")}
            </span>
          )}

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="iconSm"
                className="absolute right-4 top-4 text-muted-foreground hover:text-gold"
                aria-label={
                  isFavorite
                    ? `Remove ${tool.title} from favorites`
                    : `Add ${tool.title} to favorites`
                }
                onClick={(event) => {
                  event.preventDefault()
                  toggleFavorite(tool.slug)
                }}
              >
                <Star
                  className={cn("size-4 transition-colors", isFavorite && "fill-gold text-gold")}
                  aria-hidden="true"
                />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {isFavorite ? "Remove from favorites" : "Save to favorites"}
            </TooltipContent>
          </Tooltip>
        </div>

        <div className="flex flex-1 flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-[15px] font-semibold tracking-tight text-foreground">
              {tool.title}
            </h3>
            {tool.isNew && (
              <span className="rounded-full bg-gold/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-gold">
                New
              </span>
            )}
          </div>
          <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
            {tool.shortDescription}
          </p>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-border pt-3.5">
          <div className="flex items-center gap-2">
            <ToolStatusBadge tier={tool.tier} />
          </div>
          {tool.usage > 0 && <Rating value={tool.rating} />}
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          {tool.usage > 0 ? (
            <span className="inline-flex items-center gap-1.5">
              <Users className="size-3.5" aria-hidden="true" />
              <span>{formatUsage(tool.usage)} runs / mo</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5">
              <FlaskConical className="size-3.5" aria-hidden="true" />
              <span>In the lab</span>
            </span>
          )}
          <span
            className={cn(
              "inline-flex items-center gap-1 text-gold opacity-0 transition-opacity duration-300 group-hover:opacity-100"
            )}
          >
            Open tool
            <ArrowRight className="size-3.5" aria-hidden="true" />
          </span>
        </div>
      </Link>
    </motion.div>
  )
}
