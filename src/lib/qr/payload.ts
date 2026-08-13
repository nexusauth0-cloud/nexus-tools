import {
  QR_BODY_MAX_CHARS,
  QR_EMAIL_MAX_CHARS,
  QR_MESSAGE_MAX_CHARS,
  QR_PHONE_MAX_CHARS,
  QR_SUBJECT_MAX_CHARS,
  QR_TEXT_MAX_CHARS,
  QR_URL_MAX_CHARS,
  QR_WIFI_PASSWORD_MAX_CHARS,
  QR_WIFI_SSID_MAX_CHARS,
  type QrPayloadInput,
  type WifiSecurity,
} from "./types"

/**
 * QR payload builders — pure functions that turn user input into the exact
 * payload string stored in the QR code. All escaping is applied here so the
 * encoder never receives raw user text in a context-sensitive position.
 */

export class QrPayloadError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "QrPayloadError"
  }
}

/** UTF-8 byte length, matching what the QR encoder will actually encode. */
export function utf8ByteLength(text: string): number {
  return new TextEncoder().encode(text).length
}

function requireWithin(value: string, max: number, label: string): void {
  if (value.length > max) {
    throw new QrPayloadError(`${label} is too long (${value.length} characters, max ${max}).`)
  }
}

function isAscii(value: string): boolean {
  return /^[\x00-\x7f]*$/.test(value)
}

/**
 * Escape a Wi-Fi SSID/password per the QR WIFI payload spec.
 * Backslash, semicolon, comma, colon, and double quote are backslash-escaped.
 */
export function escapeWifiValue(value: string): string {
  return value.replace(/[\\;,:"']/g, (char) => `\\${char}`)
}

/** Build a `WIFI:T:..;S:..;P:..;H:..;;` payload (WPA/WPA2, WEP, or open). */
export function buildWifiPayload(input: {
  ssid: string
  password: string
  security: WifiSecurity
  hidden: boolean
}): string {
  const { ssid, password, security, hidden } = input
  if (ssid.length === 0) throw new QrPayloadError("Enter a network name (SSID).")
  requireWithin(ssid, QR_WIFI_SSID_MAX_CHARS, "Network name")
  if (security !== "nopass") {
    requireWithin(password, QR_WIFI_PASSWORD_MAX_CHARS, "Password")
    if (password.length === 0) {
      throw new QrPayloadError("Enter a password for this network, or choose Open network.")
    }
  }
  const parts = [`T:${security}`, `S:${escapeWifiValue(ssid)}`]
  if (security !== "nopass") parts.push(`P:${escapeWifiValue(password)}`)
  if (hidden) parts.push("H:true")
  return `WIFI:${parts.join(";")};;`
}

/** Build a `mailto:` payload with subject/body, properly URL-encoded. */
export function buildEmailPayload(input: { email: string; subject: string; body: string }): string {
  const { email, subject, body } = input
  const trimmed = email.trim()
  if (trimmed.length === 0) throw new QrPayloadError("Enter an email address.")
  requireWithin(trimmed, QR_EMAIL_MAX_CHARS, "Email address")
  requireWithin(subject, QR_SUBJECT_MAX_CHARS, "Subject")
  requireWithin(body, QR_BODY_MAX_CHARS, "Body")

  const query = new URLSearchParams()
  if (subject.length > 0) query.set("subject", subject)
  if (body.length > 0) query.set("body", body)
  const queryString = query.toString()

  return queryString.length > 0
    ? `mailto:${encodeURIComponent(trimmed).replace(/%40/i, "@")}?${queryString}`
    : `mailto:${trimmed}`
}

/** Build a `tel:` payload. Digits, +, (), -, and spaces are allowed. */
export function buildPhonePayload(phone: string): string {
  const trimmed = phone.trim()
  if (trimmed.length === 0) throw new QrPayloadError("Enter a phone number.")
  requireWithin(trimmed, QR_PHONE_MAX_CHARS, "Phone number")
  if (!/^[+\d()\-\s.]+$/.test(trimmed)) {
    throw new QrPayloadError("Phone numbers may only contain digits, +, -, (, ), . and spaces.")
  }
  return `tel:${trimmed.replace(/\s+/g, " ")}`
}

/** Build an `sms:` payload with an optional message. */
export function buildSmsPayload(input: { phone: string; message: string }): string {
  const phone = input.phone.trim()
  if (phone.length === 0) throw new QrPayloadError("Enter a phone number.")
  requireWithin(phone, QR_PHONE_MAX_CHARS, "Phone number")
  requireWithin(input.message, QR_MESSAGE_MAX_CHARS, "Message")
  if (!/^[+\d()\-\s.]+$/.test(phone)) {
    throw new QrPayloadError("Phone numbers may only contain digits, +, -, (, ), . and spaces.")
  }
  const message = input.message.trim()
  if (message.length === 0) return `sms:${phone}`
  return `sms:${phone}?body=${encodeURIComponent(message)}`
}

/** Build a URL payload. No network request is ever made. */
export function buildUrlPayload(url: string): string {
  const trimmed = url.trim()
  if (trimmed.length === 0) throw new QrPayloadError("Enter a URL.")
  requireWithin(trimmed, QR_URL_MAX_CHARS, "URL")
  let parsed: URL
  try {
    parsed = new URL(trimmed)
  } catch {
    throw new QrPayloadError(
      "That does not look like a valid URL. Include the protocol, e.g. https://example.com."
    )
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new QrPayloadError("Only http:// and https:// URLs are supported.")
  }
  return parsed.toString()
}

/** Validate plain text payload. */
export function buildTextPayload(text: string): string {
  if (text.trim().length === 0) throw new QrPayloadError("Enter some text to encode.")
  requireWithin(text, QR_TEXT_MAX_CHARS, "Text")
  return text
}

/**
 * Produce the exact payload string for a QR content mode.
 * Throws QrPayloadError with a user-friendly message for bad input.
 */
export function buildPayload(input: QrPayloadInput): string {
  switch (input.type) {
    case "text":
      return buildTextPayload(input.text)
    case "url":
      return buildUrlPayload(input.url)
    case "wifi":
      return buildWifiPayload(input)
    case "email":
      return buildEmailPayload(input)
    case "phone":
      return buildPhonePayload(input.phone)
    case "sms":
      return buildSmsPayload(input)
  }
}

/**
 * Human-readable content label for a generated QR (for UI + history).
 * Never includes the payload itself, so credentials stay out of analytics
 * and persisted history.
 */
export function describePayload(input: QrPayloadInput): string {
  switch (input.type) {
    case "text":
      return "plain text"
    case "url":
      return "URL"
    case "wifi":
      return input.security === "nopass" ? "open Wi-Fi network" : `${input.security} Wi-Fi network`
    case "email":
      return "email"
    case "phone":
      return "phone number"
    case "sms":
      return "SMS"
  }
}

/**
 * Whether the payload contains characters outside ASCII — used for tests
 * and informational UI only (the encoder handles UTF-8 automatically).
 */
export function hasNonAscii(text: string): boolean {
  return !isAscii(text)
}
