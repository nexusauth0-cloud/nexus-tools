import type { Metadata, Viewport } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import "./globals.css"
import { siteConfig } from "@/lib/site"
import { Providers } from "@/components/providers/providers"
import { ThemeInitScript } from "@/components/providers/theme-provider"
import { ServiceWorkerRegistrar } from "@/components/providers/service-worker-registrar"
import { SkipLink } from "@/components/layout/skip-link"
import { SiteHeader } from "@/components/layout/site-header"
import { SiteFooter } from "@/components/layout/site-footer"
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav"
import { CommandMenu } from "@/components/layout/command-menu"
import { PageTransition } from "@/components/layout/page-transition"
import { Toaster } from "@/components/ui/sonner"

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.name} — Fast, Private Online Tools`,
    template: `%s · ${siteConfig.name}`,
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  authors: [{ name: "NEXUS Tools Team" }],
  keywords: [...siteConfig.keywords],
  creator: "NEXUS Tools Team",
  publisher: "NEXUS Tools",
  category: "technology",
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.png",
    apple: "/icons/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: siteConfig.shortName,
  },
  formatDetection: {
    telephone: false,
    address: false,
    email: false,
  },
  openGraph: {
    type: "website",
    url: siteConfig.url,
    siteName: siteConfig.name,
    title: `${siteConfig.name} — Fast, Private Online Tools`,
    description: siteConfig.description,
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    site: siteConfig.twitterHandle,
    creator: siteConfig.twitterHandle,
    title: `${siteConfig.name} — Fast, Private Online Tools`,
    description: siteConfig.description,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafaf7" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0c" },
  ],
  colorScheme: "dark light",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`dark ${GeistSans.variable} ${GeistMono.variable} h-full scroll-smooth antialiased`}
      suppressHydrationWarning
    >
      <head>
        <ThemeInitScript />
      </head>
      <body className="min-h-screen flex flex-col">
        <Providers>
          <SkipLink />
          <SiteHeader />
          <main id="main" className="flex flex-1 flex-col pb-16 md:pb-0">
            <PageTransition>{children}</PageTransition>
          </main>
          <SiteFooter />
          <MobileBottomNav />
          <CommandMenu />
          <Toaster richColors position="bottom-right" offset="5rem" />
          <ServiceWorkerRegistrar />
        </Providers>
      </body>
    </html>
  )
}
