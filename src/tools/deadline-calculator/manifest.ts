import { defineToolManifest } from "@/shared/manifest"

export const manifest = defineToolManifest({
  slug: "deadline-calculator",
  title: "Deadline Calculator",
  shortDescription: "Work out due dates from start date, duration, and working days.",
  description:
    "Work out due dates from start date, duration, and working days. Skip weekends and holidays, and export the result to your own workflow.",
  categoryId: "productivity",
  icon: "CalendarClock",
  keywords: ["deadline", "due", "date", "calendar", "project"],
  tags: ["productivity", "planning"],
  featured: false,
  popular: false,
  isNew: true,
  tier: "free",
  usage: 470000,
  rating: 4.4,
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
