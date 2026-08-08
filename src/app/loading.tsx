import { ToolCardSkeletonGrid } from "@/components/design-system/tool-card-skeleton"
import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="container-site flex flex-col gap-10 py-16 sm:py-24">
      <div className="flex flex-col items-center gap-4 text-center">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-12 w-3/4 max-w-xl" />
        <Skeleton className="h-5 w-2/3 max-w-md" />
      </div>
      <ToolCardSkeletonGrid count={6} />
    </div>
  )
}
