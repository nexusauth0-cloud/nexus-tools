import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, CalendarDays, Clock } from "lucide-react"
import { cn, createMetadata, formatDate } from "@/lib"
import { blogPosts, getBlogPost } from "@/data/blog"
import { PageHeader } from "@/components/design-system/page-header"
import { Reveal, Stagger, StaggerItem } from "@/components/design-system/motion"
import { BlogCard } from "@/components/design-system/blog-card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

interface BlogPostPageProps {
  params: Promise<{ slug: string }>
}

export function generateStaticParams() {
  return blogPosts.map((post) => ({ slug: post.slug }))
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params
  const post = getBlogPost(slug)

  if (!post) {
    return createMetadata({ title: "Article not found", noindex: true, path: `/blog/${slug}` })
  }

  return createMetadata({
    title: post.title,
    description: post.excerpt,
    path: `/blog/${slug}`,
    type: "article",
    keywords: post.tags,
  })
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params
  const post = getBlogPost(slug)

  if (!post) notFound()

  const related = blogPosts.filter((item) => item.slug !== post.slug).slice(0, 3)
  const initials = post.author.name
    .split(" ")
    .map((part) => part[0])
    .join("")

  return (
    <article className="container-site flex flex-col gap-12 py-16 sm:py-24">
      <Button variant="ghost" size="sm" className="w-fit -mb-6" asChild>
        <Link href="/blog">
          <ArrowLeft className="size-4" aria-hidden="true" />
          All articles
        </Link>
      </Button>

      <Reveal>
        <div className="flex flex-col gap-6">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="gold">{post.category}</Badge>
            {post.tags.map((tag) => (
              <Badge key={tag} variant="soft">
                #{tag}
              </Badge>
            ))}
          </div>

          <h1 className="max-w-3xl text-balance text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
            {post.title}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2.5">
              <Avatar className="size-9">
                <AvatarFallback className="bg-primary/10 text-xs font-semibold text-gold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="font-medium text-foreground">{post.author.name}</span>
                <span className="text-xs">{post.author.role}</span>
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="size-4" aria-hidden="true" />
              {formatDate(post.publishedAt)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="size-4" aria-hidden="true" />
              {post.readTime} min read
            </span>
          </div>
        </div>
      </Reveal>

      <Separator />

      <Reveal delay={0.08}>
        <div
          className={cn(
            "flex h-52 items-end justify-between rounded-2xl border border-border bg-gradient-to-br p-6 sm:h-64 sm:p-8",
            post.gradient
          )}
        >
          <span className="text-sm font-semibold uppercase tracking-[0.2em] text-gold">
            NEXUS Field Notes
          </span>
        </div>
      </Reveal>

      <Reveal delay={0.12} className="max-w-2xl">
        <div className="flex flex-col gap-8">
          <p className="text-lg leading-relaxed text-foreground">{post.excerpt}</p>
          {post.content.map((section, index) => (
            <section key={section.heading} className="flex flex-col gap-3">
              <h2 className="text-xl font-semibold tracking-tight text-foreground">
                {index + 1}. {section.heading}
              </h2>
              {section.body.map((paragraph) => (
                <p key={paragraph} className="text-base leading-relaxed text-muted-foreground">
                  {paragraph}
                </p>
              ))}
            </section>
          ))}
        </div>
      </Reveal>

      {related.length > 0 && (
        <>
          <Separator />
          <div className="flex flex-col gap-8">
            <PageHeader eyebrow="Keep reading" title="Related field notes" className="gap-2" />
            <Stagger className="grid gap-4 md:grid-cols-3">
              {related.map((item) => (
                <StaggerItem key={item.slug} className="h-full">
                  <BlogCard post={item} />
                </StaggerItem>
              ))}
            </Stagger>
          </div>
        </>
      )}
    </article>
  )
}
