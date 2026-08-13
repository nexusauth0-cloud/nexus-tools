interface IntlNumberOptions {
  notation?: "standard" | "compact"
  maximumFractionDigits?: number
}

export function formatNumber(value: number, options: IntlNumberOptions = {}): string {
  return new Intl.NumberFormat("en-US", {
    notation: options.notation ?? "standard",
    maximumFractionDigits: options.maximumFractionDigits ?? 1,
  }).format(value)
}

export function formatUsage(value: number): string {
  if (value >= 1_000_000) {
    return `${formatNumber(value / 1_000_000)}M`
  }
  if (value >= 1_000) {
    return `${formatNumber(value / 1_000)}K`
  }
  return String(value)
}

export function formatPrice(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: value % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(value)
}

export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(iso))
}

export function formatTrend(value: number): string {
  const sign = value > 0 ? "+" : ""
  return `${sign}${value.toFixed(1)}%`
}

/** Compact relative time, e.g. "3m ago", "2h ago", "yesterday". */
export function formatRelativeTime(timestamp: number, now: number = Date.now()): string {
  const seconds = Math.max(0, Math.floor((now - timestamp) / 1000))
  if (seconds < 60) return "just now"
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days === 1) return "yesterday"
  if (days < 7) return `${days}d ago`
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(
    new Date(timestamp)
  )
}
