import { createMetadata } from "@/lib"
import { getCategories } from "@/lib/platform"
import { PageHeader } from "@/components/design-system/page-header"
import { CategoryCard } from "@/components/design-system/category-card"
import { Stagger } from "@/components/design-system/motion"

export const metadata = createMetadata({
  title: "Categories",
  description:
    "Explore every NEXUS Tools category — image, text, developer, media, security, and more.",
  path: "/categories",
})

export default function CategoriesPage() {
  const categories = getCategories()

  return (
    <div className="container-site flex flex-col gap-12 py-16 sm:py-24">
      <PageHeader
        eyebrow="Browse"
        title="Twelve categories, zero clutter"
        description="Every tool is filed under a category that actually matches how you work."
      />
      <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((category) => (
          <CategoryCard key={category.id} category={category} />
        ))}
      </Stagger>
    </div>
  )
}
