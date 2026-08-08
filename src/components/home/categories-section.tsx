import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { getFeaturedCategories } from "@/lib/platform"
import { Section, SectionHeading } from "@/components/design-system/section-heading"
import { CategoryCard } from "@/components/design-system/category-card"
import { Stagger } from "@/components/design-system/motion"
import { Button } from "@/components/ui/button"

export function CategoriesSection() {
  return (
    <Section id="categories" className="bg-card/30">
      <div className="flex flex-col gap-10">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeading
            align="left"
            eyebrow="Categories"
            title="One toolkit, every workflow"
            description="Twelve carefully curated categories cover the tools you reach for daily — without the bloat."
          />
          <Button variant="outline" size="sm" asChild className="shrink-0">
            <Link href="/categories">
              Browse all categories
              <ArrowRight className="size-3.5" aria-hidden="true" />
            </Link>
          </Button>
        </div>

        <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {getFeaturedCategories().map((category) => (
            <CategoryCard key={category.id} category={category} />
          ))}
        </Stagger>
      </div>
    </Section>
  )
}
