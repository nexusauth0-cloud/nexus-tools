import type { Metadata } from "next"
import { siteConfig } from "./site"

interface SeoOptions {
  title?: string
  description?: string
  path?: string
  keywords?: string[]
  noindex?: boolean
  type?: "website" | "article"
}

function absolute(path: string) {
  return `${siteConfig.url}${path.startsWith("/") ? path : `/${path}`}`
}

export function createMetadata({
  title,
  description = siteConfig.description,
  path = "/",
  keywords = [],
  noindex = false,
  type = "website",
}: SeoOptions = {}): Metadata {
  const url = absolute(path)

  return {
    title: title ? { absolute: `${title} · ${siteConfig.name}` } : siteConfig.name,
    description,
    keywords: [...siteConfig.keywords, ...keywords],
    metadataBase: new URL(siteConfig.url),
    alternates: {
      canonical: url,
    },
    openGraph: {
      type,
      url,
      siteName: siteConfig.name,
      title: title ? `${title} · ${siteConfig.name}` : siteConfig.name,
      description,
      locale: "en_US",
    },
    twitter: {
      card: "summary_large_image",
      site: siteConfig.twitterHandle,
      creator: siteConfig.twitterHandle,
      title: title ? `${title} · ${siteConfig.name}` : siteConfig.name,
      description,
    },
    robots: noindex
      ? { index: false, follow: false }
      : { index: true, follow: true, googleBot: { index: true, follow: true } },
  }
}
