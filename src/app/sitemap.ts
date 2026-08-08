import type { MetadataRoute } from "next"
import { siteConfig } from "@/lib/site"
import { getAllTools, getCategories } from "@/lib/platform"
import { blogPosts } from "@/data/blog"

const root = siteConfig.url

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: root, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${root}/tools`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${root}/categories`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${root}/pricing`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${root}/blog`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${root}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${root}/contact`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${root}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${root}/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ]

  const categoryRoutes: MetadataRoute.Sitemap = getCategories().map((category) => ({
    url: `${root}/categories/${category.id}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.8,
  }))

  const toolRoutes: MetadataRoute.Sitemap = getAllTools().map((tool) => ({
    url: `${root}/tools/${tool.slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.9,
  }))

  const blogRoutes: MetadataRoute.Sitemap = blogPosts.map((post) => ({
    url: `${root}/blog/${post.slug}`,
    lastModified: new Date(post.publishedAt),
    changeFrequency: "monthly",
    priority: 0.6,
  }))

  return [...staticRoutes, ...categoryRoutes, ...toolRoutes, ...blogRoutes]
}
