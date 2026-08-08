declare module "next-pwa" {
  interface PwaOptions {
    dest?: string
    disable?: boolean
    register?: boolean
    skipWaiting?: boolean
    clientsClaim?: boolean
    cacheOnFrontEndNav?: boolean
    reloadOnOnline?: boolean
    scope?: string
    sw?: string
    publicExcludes?: string[]
    buildExcludes?: string[]
    runtimeCaching?: unknown[]
    fallbacks?: Record<string, string>
    additionalManifestEntries?: { url: string; revision: string }[]
    ignoreURLParametersMatching?: (string | number)[]
    importScripts?: string[]
    modifyURLPrefix?: Record<string, string>
    manifestTransforms?: unknown[]
    customWorkerDir?: string
  }

  const nextPWA: (options?: PwaOptions) => (nextConfig: unknown) => unknown

  export default nextPWA
}
