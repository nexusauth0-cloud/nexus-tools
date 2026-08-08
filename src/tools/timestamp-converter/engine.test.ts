import { describe, expect, it } from "vitest"
import { currentTimestamp, timestampConverterEngine, MAX_DATE_MS } from "./engine"

describe("timestampConverterEngine — seconds", () => {
  it("converts a Unix seconds value to a date", async () => {
    const result = await timestampConverterEngine.run({ mode: "seconds", value: "0" })
    expect(result.output.unixSeconds).toBe(0)
    expect(result.output.unixMilliseconds).toBe(0)
    expect(result.output.isoUtc).toBe("1970-01-01T00:00:00.000Z")
  })

  it("converts a modern seconds value with UTC ISO", async () => {
    const result = await timestampConverterEngine.run({ mode: "seconds", value: "1754611200" })
    expect(result.output.isoUtc).toBe("2025-08-08T00:00:00.000Z")
    expect(result.output.unixMilliseconds).toBe(1754611200000)
  })

  it("handles negative timestamps", async () => {
    const result = await timestampConverterEngine.run({ mode: "seconds", value: "-1" })
    expect(result.output.isoUtc).toBe("1969-12-31T23:59:59.000Z")
  })
})

describe("timestampConverterEngine — milliseconds", () => {
  it("converts epoch milliseconds", async () => {
    const result = await timestampConverterEngine.run({
      mode: "milliseconds",
      value: "1754611200000",
    })
    expect(result.output.isoUtc).toBe("2025-08-08T00:00:00.000Z")
    expect(result.output.unixSeconds).toBe(1754611200)
  })

  it("rejects decimal milliseconds", async () => {
    const error = await timestampConverterEngine
      .run({ mode: "milliseconds", value: "1.5" })
      .catch((e: unknown) => e)
    expect(error).toBeDefined()
  })
})

describe("timestampConverterEngine — ISO 8601", () => {
  it("parses a UTC ISO string", async () => {
    const result = await timestampConverterEngine.run({
      mode: "iso",
      value: "2025-08-08T00:00:00.000Z",
    })
    expect(result.output.isoUtc).toBe("2025-08-08T00:00:00.000Z")
    expect(result.output.unixSeconds).toBe(1754611200)
  })

  it("parses an offset ISO string and normalizes to UTC", async () => {
    const result = await timestampConverterEngine.run({
      mode: "iso",
      value: "2025-08-08T02:00:00.000+02:00",
    })
    expect(result.output.isoUtc).toBe("2025-08-08T00:00:00.000Z")
  })

  it("rejects invalid ISO input", async () => {
    const error = await timestampConverterEngine
      .run({ mode: "iso", value: "not a date" })
      .catch((e: unknown) => e)
    expect(error).toBeDefined()
  })
})

describe("timestampConverterEngine — local rendering", () => {
  it("always exposes an explicit timezone", async () => {
    const result = await timestampConverterEngine.run({ mode: "seconds", value: "0" })
    expect(result.output.timezone).toBeDefined()
    expect(result.output.timezone.length).toBeGreaterThan(0)
    expect(result.output.localLabel).toContain(result.output.timezone)
    expect(result.output.localLabel).toContain("UTC")
  })

  it("marks isUtc when the timezone really is UTC", async () => {
    const result = await timestampConverterEngine.run({ mode: "seconds", value: "0" })
    expect(typeof result.output.isUtc).toBe("boolean")
  })

  it("round-trips local ISO through the ISO mode", async () => {
    const first = await timestampConverterEngine.run({ mode: "seconds", value: "1234567890" })
    const second = await timestampConverterEngine.run({ mode: "iso", value: first.output.isoLocal })
    expect(second.output.unixSeconds).toBe(1234567890)
  })
})

describe("timestampConverterEngine — boundaries and errors", () => {
  it("supports the maximum safe Date range", async () => {
    const result = await timestampConverterEngine.run({
      mode: "milliseconds",
      value: String(MAX_DATE_MS),
    })
    expect(result.output.unixMilliseconds).toBe(MAX_DATE_MS)
  })

  it("rejects values beyond the Date range", async () => {
    const error = await timestampConverterEngine
      .run({ mode: "seconds", value: "9000000000000000" })
      .catch((e: unknown) => e)
    expect(error).toBeDefined()
  })

  it("rejects malformed numeric input", async () => {
    for (const bad of ["abc", "1e5", "12.5", "Infinity", ""]) {
      const error = await timestampConverterEngine
        .run({ mode: "seconds", value: bad })
        .catch((e: unknown) => e)
      expect(error).toBeDefined()
    }
  })

  it("rejects an unknown mode", async () => {
    const error = await timestampConverterEngine
      .run({ mode: "fortnights", value: "1" } as never)
      .catch((e: unknown) => e)
    expect(error).toBeDefined()
  })
})

describe("currentTimestamp", () => {
  it("returns parseable values for every mode", async () => {
    for (const mode of ["seconds", "milliseconds", "iso"] as const) {
      const value = currentTimestamp(mode)
      const result = await timestampConverterEngine.run({ mode, value })
      expect(Math.abs(result.output.unixMilliseconds - Date.now())).toBeLessThanOrEqual(1500)
    }
  })
})
