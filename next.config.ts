import type { NextConfig } from "next"
import nextPWA from "next-pwa"

type WorkboxUrlPattern = RegExp | string | ((context: { url: URL; request: Request }) => boolean)

interface RuntimeCachingEntry {
  urlPattern: WorkboxUrlPattern
  handler: string
  options?: Record<string, unknown>
}

/**
 * Deliberately scoped cache strategy.
 *
 * Only same-origin build assets, fonts, and navigation are cached by the
 * service worker. There is deliberately NO generic cross-origin handler:
 * tools like HTTP Request Builder and the SEO checkers fetch arbitrary
 * user-supplied URLs, and those responses (which may contain private data)
 * must never be written into the SW cache. There are no /api routes in
 * this application, so no API caching is configured either.
 */
const runtimeCaching: RuntimeCachingEntry[] = [
  {
    urlPattern: "/",
    handler: "NetworkFirst",
    options: {
      cacheName: "start-url",
      plugins: [
        {
          cacheWillUpdate: async ({ response }: { response: Response }) =>
            response && response.type === "opaqueredirect"
              ? new Response(response.body, {
                  status: 200,
                  statusText: "OK",
                  headers: response.headers,
                })
              : response,
        },
      ],
    },
  },
  {
    urlPattern: /^https:\/\/fonts\.(?:gstatic)\.com\/.*/i,
    handler: "CacheFirst",
    options: {
      cacheName: "google-fonts-webfonts",
      expiration: { maxEntries: 4, maxAgeSeconds: 365 * 24 * 60 * 60 },
    },
  },
  {
    urlPattern: /^https:\/\/fonts\.(?:googleapis)\.com\/.*/i,
    handler: "CacheFirst",
    options: {
      cacheName: "google-fonts-stylesheets",
      expiration: { maxEntries: 4, maxAgeSeconds: 7 * 24 * 60 * 60 },
    },
  },
  {
    urlPattern: ({ url, request }) =>
      url.origin === self.location.origin && request.mode === "navigate",
    handler: "NetworkFirst",
    options: {
      cacheName: "same-origin-documents",
      networkTimeoutSeconds: 10,
      expiration: { maxEntries: 32, maxAgeSeconds: 24 * 60 * 60 },
    },
  },
  {
    urlPattern: ({ url }) =>
      url.origin === self.location.origin && /^\/_next\/static\/.*/i.test(url.pathname),
    handler: "CacheFirst",
    options: {
      cacheName: "next-static-assets",
      expiration: { maxEntries: 64, maxAgeSeconds: 24 * 60 * 60 },
    },
  },
  {
    urlPattern: ({ url }) =>
      url.origin === self.location.origin && /^\/_next\/image\?url=.+/i.test(url.pathname),
    handler: "CacheFirst",
    options: {
      cacheName: "next-image",
      expiration: { maxEntries: 64, maxAgeSeconds: 24 * 60 * 60 },
    },
  },
]

const pwa = nextPWA({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: false,
  skipWaiting: true,
  clientsClaim: true,
  cacheOnFrontEndNav: true,
  reloadOnOnline: true,
  publicExcludes: ["!**/*.map"],
  runtimeCaching,
})

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
  experimental: {
    optimizePackageImports: ["lucide-react", "framer-motion"],
  },
  async redirects() {
    return [
      {
        source: "/t/json",
        destination: "/tools/json-formatter",
        permanent: true,
      },
      {
        source: "/t/color",
        destination: "/tools/color-converter",
        permanent: true,
      },
      {
        source: "/t/yaml",
        destination: "/tools/yaml",
        permanent: true,
      },
      {
        source: "/t/csv",
        destination: "/tools/csv",
        permanent: true,
      },
      {
        source: "/t/radix",
        destination: "/tools/radix",
        permanent: true,
      },
    ]
  },
}

export default pwa(nextConfig)
