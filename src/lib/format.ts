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
