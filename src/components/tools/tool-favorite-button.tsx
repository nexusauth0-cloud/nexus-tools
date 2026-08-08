"use client"

import { Star } from "lucide-react"
import { cn } from "@/lib"
import type { ToolManifest } from "@/shared/manifest"
import { useFavoritesStore } from "@/store/favorites-store"
import { Button, type ButtonProps } from "@/components/ui/button"

interface ToolFavoriteButtonProps extends Omit<ButtonProps, "onClick" | "children"> {
  tool: ToolManifest
}

export function ToolFavoriteButton({
  tool,
  size = "lg",
  className,
  ...props
}: ToolFavoriteButtonProps) {
  const isFavorite = useFavoritesStore((state) => state.isFavorite(tool.slug))
  const toggleFavorite = useFavoritesStore((state) => state.toggleFavorite)

  return (
    <Button
      type="button"
      size={size}
      variant={isFavorite ? "subtle" : "default"}
      onClick={() => toggleFavorite(tool.slug)}
      aria-pressed={isFavorite}
      aria-label={
        isFavorite ? `Remove ${tool.title} from favorites` : `Add ${tool.title} to favorites`
      }
      className={cn(className)}
      {...props}
    >
      <Star
        className={cn("size-4 transition-colors", isFavorite && "fill-gold text-gold")}
        aria-hidden="true"
      />
      {isFavorite ? "Favorited" : "Save for launch"}
    </Button>
  )
}
