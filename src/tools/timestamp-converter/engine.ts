import { z } from "zod"
import { createToolEngine, summarize, ToolExecutionError } from "@/lib/tool-engine"

/**
 * Timestamp Converter engine — parses and renders Unix timestamps.
 *
 * Supports seconds, milliseconds, and ISO 8601 input; renders UTC and
 * local time with the IANA timezone label so results are never ambiguous.
 * Values outside the JavaScript Date range are rejected with a friendly
 * message instead of silently overflowing.
 */

export const TIMESTAMP_MODES = ["seconds", "milliseconds", "iso"] as const
export type TimestampMode = (typeof TIMESTAMP_MODES)[number]

/** Largest integer Date can represent as epoch milliseconds. */
export const MAX_DATE_MS = 8_640_000_000_000_000

export interface TimestampOutput {
  mode: TimestampMode
  /** Original input, normalized. */
  source: string
  unixSeconds: number
  unixMilliseconds: number
  /** ISO 8601 with explicit offset (UTC). */
  isoUtc: string
  /** ISO 8601 in the local timezone. */
  isoLocal: string
  /** Human-readable, timezone-explicit local time. */
  localLabel: string
  /** IANA timezone, e.g. "Europe/Berlin" — never "local time". */
  timezone: string
  /** True when the rendered local time is in UTC. */
  isUtc: boolean
}

const schema = z.object({
  mode: z.enum(TIMESTAMP_MODES),
  value: z.string().trim().min(1, "Enter a timestamp.").max(200, "Input is too long."),
})

export const timestampConverterEngine = createToolEngine<typeof schema, TimestampOutput>({
  toolId: "timestamp-converter",
  schema,
  process: ({ mode, value }) => {
    const millis = parseToMillis(mode, value)

    const date = new Date(millis)
    if (Number.isNaN(date.getTime())) {
      throw new ToolExecutionError(
        "VALIDATION",
        "This value cannot be represented as a date — it is outside the supported range."
      )
    }

    const timezone = detectTimezone()
    return {
      mode,
      source: value,
      unixSeconds: Math.floor(millis / 1000),
      unixMilliseconds: millis,
      isoUtc: date.toISOString(),
      isoLocal: toLocalIso(date),
      localLabel: formatLocal(date, timezone),
      timezone,
      isUtc: timezone === "UTC",
    }
  },
  summarize: {
    input: (input) => summarize(`${input.mode}: ${input.value}`),
    output: (output) => summarize(output.localLabel),
  },
})

/** Current time as a ready-to-fill snippet for the input box. */
export function currentTimestamp(mode: TimestampMode): string {
  const now = Date.now()
  switch (mode) {
    case "seconds":
      return String(Math.floor(now / 1000))
    case "milliseconds":
      return String(now)
    case "iso":
      return new Date(now).toISOString()
  }
}

function parseToMillis(mode: TimestampMode, value: string): number {
  const raw = value.trim()
  switch (mode) {
    case "seconds": {
      const seconds = Number(raw)
      if (!isSafeEpochNumber(raw, seconds)) {
        throw new ToolExecutionError("VALIDATION", "Enter a whole number of Unix seconds.")
      }
      return seconds * 1000
    }
    case "milliseconds": {
      const millis = Number(raw)
      if (!isSafeEpochNumber(raw, millis)) {
        throw new ToolExecutionError("VALIDATION", "Enter a whole number of milliseconds.")
      }
      return millis
    }
    case "iso": {
      const date = new Date(raw)
      if (Number.isNaN(date.getTime())) {
        throw new ToolExecutionError("VALIDATION", "Not a valid ISO 8601 date-time.")
      }
      return date.getTime()
    }
  }
}

/**
 * Accepts integers only (no decimals, no exponent formatting, no
 * whitespace surprises) and rejects anything beyond Date's range.
 */
function isSafeEpochNumber(raw: string, value: number): boolean {
  if (!/^-?\d+$/.test(raw)) return false
  if (!Number.isSafeInteger(value)) return false
  return Math.abs(value) <= MAX_DATE_MS
}

function detectTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"
  } catch {
    return "UTC"
  }
}

function toLocalIso(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  const hours = String(date.getHours()).padStart(2, "0")
  const minutes = String(date.getMinutes()).padStart(2, "0")
  const seconds = String(date.getSeconds()).padStart(2, "0")
  const offset = localOffset(date)
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}${offset}`
}

function localOffset(date: Date): string {
  const offsetMinutes = -date.getTimezoneOffset()
  const sign = offsetMinutes >= 0 ? "+" : "-"
  const absolute = Math.abs(offsetMinutes)
  const hours = String(Math.floor(absolute / 60)).padStart(2, "0")
  const minutes = String(absolute % 60).padStart(2, "0")
  return `${sign}${hours}:${minutes}`
}

function formatLocal(date: Date, timezone: string): string {
  const time = date.toLocaleTimeString("en-GB", { hour12: false })
  const day = date.toLocaleDateString("en-GB")
  return `${day} ${time} ${timezone} (UTC${localOffset(date)})`
}
