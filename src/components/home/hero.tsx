"use client"

import Link from "next/link"
import { motion, useReducedMotion } from "framer-motion"
import { ArrowRight, Lock, ShieldCheck, WifiOff } from "lucide-react"
import { SearchTrigger } from "@/components/layout/search-trigger"
import { getFeaturedCategories, getFeaturedTools } from "@/lib/platform"
import { resolveIcon } from "@/lib/icons"
import { cn } from "@/lib"

const EASE = [0.22, 1, 0.36, 1] as const

const trustItems = [
  { icon: ShieldCheck, label: "Zero data uploads" },
  { icon: WifiOff, label: "Works offline" },
  { icon: Lock, label: "Free forever tier" },
]

export function Hero() {
  const reduceMotion = useReducedMotion()
  const quickLinks = getFeaturedCategories().slice(0, 4)
  const previewTools = getFeaturedTools().slice(0, 6)

  return (
    <section className="relative overflow-hidden">
      <div className="container-site flex flex-col items-center gap-10 pb-16 pt-20 sm:pt-28 lg:pb-24">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: EASE }}
          className="flex flex-col items-center gap-6 text-center"
        >
          <Link
            href="/tools"
            className="group inline-flex items-center gap-2.5 rounded-full border border-primary/25 bg-primary/10 px-4 py-1.5 text-xs font-medium text-gold transition-colors hover:bg-primary/15"
          >
            <span className="flex items-center gap-1.5">
              <span className="relative flex size-1.5" aria-hidden="true">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-gold opacity-60" />
                <span className="relative inline-flex size-1.5 rounded-full bg-gold" />
              </span>
              55 tools, always free
            </span>
            <ArrowRight
              className="size-3.5 transition-transform duration-300 group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </Link>

          <div className="flex flex-col gap-4">
            <h1 className="max-w-3xl text-balance text-5xl font-semibold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
              <span className="text-gradient-soft">Every online tool,</span>
              <br />
              <span className="text-gradient-gold">crafted for speed.</span>
            </h1>
            <p className="mx-auto max-w-xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
              One search bar for 55 fast, private tools — image, text, code, and beyond. No
              accounts, no uploads, no friction.
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.12, ease: EASE }}
          className="w-full max-w-2xl"
        >
          <SearchTrigger variant="hero" />
          <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
            {quickLinks.map((category) => (
              <Link
                key={category.id}
                href={`/categories/${category.id}`}
                className="rounded-full border border-border bg-card/60 px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/30 hover:text-foreground"
              >
                {category.name}
              </Link>
            ))}
            <Link
              href="/tools"
              className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium text-gold transition-colors hover:underline"
            >
              View all
              <ArrowRight className="size-3" aria-hidden="true" />
            </Link>
          </div>
        </motion.div>

        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.24, ease: EASE }}
          className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground"
        >
          {trustItems.map(({ icon: Icon, label }) => (
            <span key={label} className="inline-flex items-center gap-1.5">
              <Icon className="size-3.5 text-gold" aria-hidden="true" />
              {label}
            </span>
          ))}
        </motion.div>

        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 32, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.9, delay: 0.36, ease: EASE }}
          className="relative w-full max-w-4xl"
        >
          <div
            aria-hidden="true"
            className="absolute -inset-x-8 -top-10 bottom-0 -z-10 bg-[radial-gradient(60%_60%_at_50%_0%,oklch(0.8_0.145_85/0.14),transparent_70%)]"
          />
          <div className="grid grid-cols-2 gap-3 rounded-2xl border border-border bg-card/70 p-3 shadow-card backdrop-blur-sm sm:grid-cols-3 sm:p-4">
            {previewTools.map((tool) => {
              const Icon = resolveIcon(tool.icon)
              return (
                <Link
                  key={tool.slug}
                  href={`/tools/${tool.slug}`}
                  className="group flex items-center gap-3 rounded-xl border border-transparent p-2.5 transition-all duration-300 hover:border-border hover:bg-surface"
                >
                  <span
                    className={cn(
                      "flex size-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br",
                      tool.gradient
                    )}
                  >
                    <Icon className="size-4 text-gold" aria-hidden="true" />
                  </span>
                  <span className="flex min-w-0 flex-col text-left">
                    <span className="truncate text-[13px] font-medium text-foreground">
                      {tool.title}
                    </span>
                    <span className="truncate text-[11px] text-muted-foreground">
                      {tool.shortDescription}
                    </span>
                  </span>
                </Link>
              )
            })}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
