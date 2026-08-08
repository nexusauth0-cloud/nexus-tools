import Link from "next/link"
import { Compass, House } from "lucide-react"
import { createMetadata } from "@/lib"
import { PageHeader } from "@/components/design-system/page-header"
import { Button } from "@/components/ui/button"

export const metadata = createMetadata({
  title: "Page not found",
  description: "The page you were looking for doesn't exist or has moved.",
  path: "/404",
  noindex: true,
})

export default function NotFound() {
  return (
    <div className="container-site flex flex-1 flex-col items-center justify-center gap-10 py-24">
      <PageHeader
        eyebrow="Error 404"
        title={
          <>
            Lost in the <span className="text-gradient-gold">void</span>
          </>
        }
        description="The page you're looking for doesn't exist — or it slipped through the wormhole. Either way, the tools are right this way."
      />
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button asChild>
          <Link href="/">
            <House className="size-4" aria-hidden="true" />
            Back to home
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/tools">
            <Compass className="size-4" aria-hidden="true" />
            Browse tools
          </Link>
        </Button>
      </div>
    </div>
  )
}
