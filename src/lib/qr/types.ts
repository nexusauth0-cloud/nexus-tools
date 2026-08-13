/**
 * Shared QR types and limits.
 *
 * Limits are enforced before generation/decoding so the tool fails with a
 * clear validation error instead of silently truncating data or producing
 * unbounded images.
 */

export const QR_TEXT_MAX_CHARS = 2000
export const QR_URL_MAX_CHARS = 2000
export const QR_WIFI_SSID_MAX_CHARS = 64
export const QR_WIFI_PASSWORD_MAX_CHARS = 128
export const QR_EMAIL_MAX_CHARS = 254
export const QR_SUBJECT_MAX_CHARS = 512
export const QR_BODY_MAX_CHARS = 2000
export const QR_PHONE_MAX_CHARS = 64
export const QR_SMS_MAX_CHARS = 2000
export const QR_MESSAGE_MAX_CHARS = 2000

/** Largest generated QR image edge (px) — keeps downloads reasonable. */
export const QR_MAX_RENDER_SIZE = 1024
export const QR_DEFAULT_RENDER_SIZE = 384
/** Quiet zone (modules) allowed range. */
export const QR_MIN_MARGIN = 0
export const QR_MAX_MARGIN = 8
export const QR_DEFAULT_MARGIN = 2
/** Smallest/largest QR version supported by the encoder (1..40). */
export const QR_MIN_VERSION = 1
export const QR_MAX_VERSION = 40

export type QrErrorCorrectionLevel = "L" | "M" | "Q" | "H"

export const QR_ERROR_CORRECTION_LEVELS: readonly QrErrorCorrectionLevel[] = ["L", "M", "Q", "H"]

export const QR_EC_ORDER: Record<QrErrorCorrectionLevel, number> = { L: 0, M: 1, Q: 2, H: 3 }

/** Content modes the generator supports (documented subset). */
export type QrContentType = "text" | "url" | "wifi" | "email" | "phone" | "sms"

export const QR_CONTENT_TYPES: readonly QrContentType[] = [
  "text",
  "url",
  "wifi",
  "email",
  "phone",
  "sms",
]

/** Wi-Fi network security (WPA/WPA2 = WPA, WEP, open). */
export type WifiSecurity = "WPA" | "WEP" | "nopass"

export const WIFI_SECURITY_OPTIONS: readonly WifiSecurity[] = ["WPA", "WEP", "nopass"]

/** A single QR payload input, before generation. */
export type QrPayloadInput =
  | { type: "text"; text: string }
  | { type: "url"; url: string }
  | { type: "wifi"; ssid: string; password: string; security: WifiSecurity; hidden: boolean }
  | { type: "email"; email: string; subject: string; body: string }
  | { type: "phone"; phone: string }
  | { type: "sms"; phone: string; message: string }

/** Rendering options that affect the generated image. */
export interface QrRenderOptions {
  /** Edge length in pixels (square image). */
  size: number
  /** Quiet zone in modules. */
  margin: number
  errorCorrectionLevel: QrErrorCorrectionLevel
  foreground: string
  background: string
}

export interface QrGeneratedMatrix {
  /** Dark modules, row-major (true = dark). */
  modules: boolean[]
  /** Module count per edge (includes quiet zone). */
  size: number
  /** QR spec version 1..40. */
  version: number
  /** Character count of the payload string. */
  characterCount: number
  /** Payload string that was encoded. */
  payload: string
}

export interface QrGenerationOptions {
  input: QrPayloadInput
  render: QrRenderOptions
  /** Optional auto version cap; undefined = let the encoder choose. */
  maxVersion?: number
}
