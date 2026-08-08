import { cn } from "@/lib"
import { Skeleton } from "@/components/ui/skeleton"

export function ToolCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex h-full flex-col gap-4 rounded-2xl border border-border bg-card p-5 shadow-card",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <Skeleton className="size-11 rounded-xl" />
        <Skeleton className="h-4 w-8" />
      </div>
      <div className="flex flex-col gap-2">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-4/5" />
      </div>
      <div className="flex items-center justify-between border-t border-border pt-3.5">
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-3 w-14" />
      </div>
    </div>
  )
}

export function ToolCardSkeletonGrid({
  count = 6,
  className,
}: {
  count?: number
  className?: string
}) {
  return (
    <div className={cn("grid gap-4 sm:grid-cols-2 lg:grid-cols-3", className)}>
      {Array.from({ length: count }, (_, index) => (
        <ToolCardSkeleton key={index} />
      ))}
    </div>
  )
}
