import { createMetadata } from "@/lib"
import { blogPosts } from "@/data/blog"
import { PageHeader } from "@/components/design-system/page-header"
import { BlogCard } from "@/components/design-system/blog-card"
import { Stagger } from "@/components/design-system/motion"

export const metadata = createMetadata({
  title: "Blog",
  description: "Field notes, guides, and deep dives from the engineers building NEXUS Tools.",
  path: "/blog",
})

export default function BlogPage() {
  return (
    <div className="container-site flex flex-col gap-12 py-16 sm:py-24">
      <PageHeader
        eyebrow="Field notes"
        title="Writing for people who build"
        description="Practical, honest guides on tools, technique, and the engineering behind them."
      />
      <Stagger className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {blogPosts.map((post) => (
          <BlogCard key={post.slug} post={post} />
        ))}
      </Stagger>
    </div>
  )
}
