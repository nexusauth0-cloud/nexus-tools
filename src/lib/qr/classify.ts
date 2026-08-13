import type { QrContentType } from "./types"

/**
 * Heuristic classification of decoded QR payloads.
 *
 * This is intentionally heuristic — a payload is "probably" a URL or email,
 * never claimed to be semantically certain. No payload content is ever
 * evaluated, executed, or auto-opened.
 */

export interface QrClassification {
  type: QrContentType | "plain"
  /** Confidence: "strong" patterns only — never claims certainty. */
  confidence: "high" | "low"
  /** Safe, non-executable reason summary for the UI. */
  reason: string
}

const WIFI_PREFIX = /^WIFI:T:/i
const MAILTO = /^mailto:/i
const TEL = /^tel:/i
const SMS = /^sms:/i
const HTTP_URL = /^https?:\/\/[^\s]+$/i

const EMAIL_LIKE = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i
const PHONE_LIKE = /^\+?[0-9][0-9\s().-]{4,}$/

/**
 * Classify decoded text. Returns "plain" for anything unrecognized.
 * JavaScript: URLs and other exotic protocols are treated as plain text —
 * they are never rendered clickable.
 */
export function classifyQrPayload(text: string): QrClassification {
  const trimmed = text.trim()

  if (HTTP_URL.test(trimmed)) {
    return { type: "url", confidence: "high", reason: "Looks like an http(s) URL." }
  }
  if (/^https?:\/\//i.test(trimmed)) {
    return { type: "url", confidence: "low", reason: "Starts like a URL." }
  }
  if (MAILTO.test(trimmed)) {
    return { type: "email", confidence: "high", reason: "Starts with mailto:." }
  }
  if (EMAIL_LIKE.test(trimmed) && !/([;&'"`])/.test(trimmed)) {
    return { type: "email", confidence: "low", reason: "Looks like an email address." }
  }
  if (TEL.test(trimmed)) {
    return { type: "phone", confidence: "high", reason: "Starts with tel:." }
  }
  if (SMS.test(trimmed)) {
    return { type: "sms", confidence: "high", reason: "Starts with sms:." }
  }
  if (PHONE_LIKE.test(trimmed)) {
    return { type: "phone", confidence: "low", reason: "Looks like a phone number." }
  }
  if (WIFI_PREFIX.test(trimmed)) {
    return { type: "wifi", confidence: "high", reason: "Matches the Wi-Fi QR payload format." }
  }
  return { type: "plain", confidence: "low", reason: "Not recognized as a structured format." }
}

/**
 * A decoded payload surfaced for action. Explicit user choice is required
 * before anything opens — the tool never auto-navigates.
 */
export interface QrDecodedContent {
  text: string
  characterCount: number
  classification: QrClassification
  /** Safe action URI, present only for protocols a browser may open. */
  actionUri: string | null
  /** Human label for the safe action, when available. */
  actionLabel: string | null
}

/** Build the safe action surface for decoded content (never auto-opened). */
export function buildDecodedContent(text: string): QrDecodedContent {
  const classification = classifyQrPayload(text)
  let actionUri: string | null = null
  let actionLabel: string | null = null

  const trimmed = text.trim()
  if (classification.type === "url" && HTTP_URL.test(trimmed)) {
    actionUri = trimmed
    actionLabel = "Open URL in a new tab"
  } else if (classification.type === "email" && MAILTO.test(trimmed)) {
    actionUri = trimmed
    actionLabel = "Compose email"
  } else if (classification.type === "phone" && TEL.test(trimmed)) {
    actionUri = trimmed
    actionLabel = "Call number"
  } else if (classification.type === "sms" && SMS.test(trimmed)) {
    actionUri = trimmed
    actionLabel = "Send SMS"
  }

  return {
    text,
    characterCount: text.length,
    classification,
    actionUri,
    actionLabel,
  }
}

/**
 * Whether decoded text is safe to render as a clickable link.
 * Only http/https/mailto/tel/sms — never javascript:, file:, data:, vbscript:.
 */
export function isSafeActionable(uri: string | null): uri is string {
  if (!uri) return false
  const protocol = uri.split(":")[0]?.toLowerCase()
  return (
    protocol === "http" ||
    protocol === "https" ||
    protocol === "mailto" ||
    protocol === "tel" ||
    protocol === "sms"
  )
}
