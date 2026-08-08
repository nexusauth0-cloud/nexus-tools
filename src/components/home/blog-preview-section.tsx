import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { featuredPosts } from "@/data/blog"
import { Section, SectionHeading } from "@/components/design-system/section-heading"
import { BlogCard } from "@/components/design-system/blog-card"
import { Stagger } from "@/components/design-system/motion"
import { Button } from "@/components/ui/button"

export function BlogPreviewSection() {
  return (
    <Section id="blog" className="bg-card/30">
      <div className="flex flex-col gap-10">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeading
            align="left"
            eyebrow="From the blog"
            title="Field notes on tools & technique"
            description="Practical guides written by the engineers building NEXUS."
          />
          <Button variant="outline" size="sm" asChild className="shrink-0">
            <Link href="/blog">
              All articles
              <ArrowRight className="size-3.5" aria-hidden="true" />
            </Link>
          </Button>
        </div>

        <Stagger className="grid gap-4 md:grid-cols-3">
          {featuredPosts.map((post) => (
            <BlogCard key={post.slug} post={post} />
          ))}
        </Stagger>
      </div>
    </Section>
  )
}
