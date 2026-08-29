import { defineToolManifest } from "@/shared/manifest"

export const manifest = defineToolManifest({
  slug: "pomodoro-timer",
  title: "Pomodoro Focus Timer",
  shortDescription: "Focus, break, and long-break cycles with ambient focus sounds.",
  description:
    "Focus, break, and long-break cycles with ambient focus sounds and a clean countdown. Runs offline and rings out on schedule.",
  categoryId: "productivity",
  icon: "Timer",
  keywords: ["pomodoro", "timer", "focus", "productivity", "study"],
  tags: ["productivity", "time", "focus"],
  featured: false,
  popular: false,
  isNew: false,
  tier: "free",
  usage: 0,
  rating: 0,
  trend: "steady",
  trendValue: 0,
  gradient: "from-violet/35 to-violet/5",
  version: "1.0.0",
  author: "NEXUS Tools",
  updatedAt: "2026-08-01",
  estimatedProcessing: "under 2s",
  supportedDevices: ["desktop", "tablet", "mobile"],
  supportedBrowsers: ["chrome", "firefox", "safari", "edge"],
})
