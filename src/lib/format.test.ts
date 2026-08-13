import { describe, expect, it } from "vitest"
import { formatRelativeTime } from "./format"

describe("formatRelativeTime", () => {
  const now = Date.UTC(2026, 0, 15, 12, 0, 0)

  it("renders sub-minute visits as just now", () => {
    expect(formatRelativeTime(now - 5_000, now)).toBe("just now")
  })

  it("renders minutes", () => {
    expect(formatRelativeTime(now - 3 * 60_000, now)).toBe("3m ago")
  })

  it("renders hours", () => {
    expect(formatRelativeTime(now - 2 * 3_600_000, now)).toBe("2h ago")
  })

  it("renders yesterday", () => {
    expect(formatRelativeTime(now - 24 * 3_600_000, now)).toBe("yesterday")
  })

  it("renders days", () => {
    expect(formatRelativeTime(now - 4 * 86_400_000, now)).toBe("4d ago")
  })

  it("renders a short date for visits older than a week", () => {
    const old = now - 30 * 86_400_000
    expect(formatRelativeTime(old, now)).toMatch(/^(Dec|Jan) \d+$/)
  })
})
