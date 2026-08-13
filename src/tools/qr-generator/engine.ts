import { z } from "zod"
import { createToolEngine, ToolExecutionError } from "@/lib/tool-engine"
import {
  QR_DEFAULT_MARGIN,
  QR_DEFAULT_RENDER_SIZE,
  QR_ERROR_CORRECTION_LEVELS,
  QR_MAX_RENDER_SIZE,
  QR_TEXT_MAX_CHARS,
  QR_URL_MAX_CHARS,
  QR_WIFI_PASSWORD_MAX_CHARS,
  QR_WIFI_SSID_MAX_CHARS,
  QR_EMAIL_MAX_CHARS,
  QR_SUBJECT_MAX_CHARS,
  QR_BODY_MAX_CHARS,
  QR_PHONE_MAX_CHARS,
  QR_SMS_MAX_CHARS,
  QrContentType,
  QR_CONTENT_TYPES,
  WifiSecurity,
  WIFI_SECURITY_OPTIONS,
} from "@/lib/qr"
import { buildPayload, QrPayloadError } from "@/lib/qr"
import { generateQrMatrix } from "@/lib/qr"
import { matrixToRgba, encodePng, hexToRgb } from "@/lib/qr"
import { renderQrSvg } from "@/lib/qr"

/**
 * QR Code Generator engine.
 *
 * Everything runs in the browser: the payload is built, the matrix is
 * generated, and both an SVG string and a PNG data URL are produced
 * locally. No network request is ever made, payloads never reach
 * analytics, and history summaries contain type + character count only —
 * never the payload itself (Wi-Fi credentials included).
 */

export const QR_MODE_OPTIONS = QR_CONTENT_TYPES.map((value) => ({ value, label: labelFor(value) }))

function labelFor(type: QrContentType): string {
  switch (type) {
    case "text":
      return "Plain text"
    case "url":
      return "URL"
    case "wifi":
      return "Wi-Fi"
    case "email":
      return "Email"
    case "phone":
      return "Phone"
    case "sms":
      return "SMS"
  }
}

const hexColor = z
  .string()
  .regex(/^#[0-9a-fA-F]{3}$|^#[0-9a-fA-F]{6}$/, "Use a hex color like #000000 or #fff.")

const schema = z.object({
  type: z.enum(QR_CONTENT_TYPES),
  text: z.string().max(QR_TEXT_MAX_CHARS).default(""),
  url: z.string().max(QR_URL_MAX_CHARS).default(""),
  ssid: z.string().max(QR_WIFI_SSID_MAX_CHARS).default(""),
  password: z.string().max(QR_WIFI_PASSWORD_MAX_CHARS).default(""),
  security: z.enum(WIFI_SECURITY_OPTIONS).default("WPA"),
  hidden: z.boolean().default(false),
  email: z.string().max(QR_EMAIL_MAX_CHARS).default(""),
  subject: z.string().max(QR_SUBJECT_MAX_CHARS).default(""),
  body: z.string().max(QR_BODY_MAX_CHARS).default(""),
  phone: z.string().max(QR_PHONE_MAX_CHARS).default(""),
  message: z.string().max(QR_SMS_MAX_CHARS).default(""),
  size: z.number().int().min(96).max(QR_MAX_RENDER_SIZE).default(QR_DEFAULT_RENDER_SIZE),
  margin: z.number().int().min(0).max(8).default(QR_DEFAULT_MARGIN),
  errorCorrectionLevel: z.enum(QR_ERROR_CORRECTION_LEVELS).default("M"),
  foreground: hexColor.default("#000000"),
  background: hexColor.default("#ffffff"),
})

export interface QrGeneratorOutput {
  /** Payload that was encoded — surfaced only in the result view. */
  payload: string
  /** SVG source for download. */
  svg: string
  /** PNG data URL for preview + download. */
  pngDataUrl: string
  /** PNG byte length, for download naming/sizing. */
  pngBytes: number
  /** QR spec version actually used. */
  version: number
  /** Module edge length including quiet zone. */
  moduleSize: number
  info: {
    mode: QrContentType
    modeLabel: string
    characterCount: number
    errorCorrectionLevel: "L" | "M" | "Q" | "H"
    renderSize: number
  }
}

export const qrGeneratorEngine = createToolEngine<typeof schema, QrGeneratorOutput>({
  toolId: "qr-generator",
  schema,
  process: (input) => {
    const payloadInput =
      input.type === "text"
        ? { type: "text" as const, text: input.text }
        : input.type === "url"
          ? { type: "url" as const, url: input.url }
          : input.type === "wifi"
            ? {
                type: "wifi" as const,
                ssid: input.ssid,
                password: input.password,
                security: input.security as WifiSecurity,
                hidden: input.hidden,
              }
            : input.type === "email"
              ? {
                  type: "email" as const,
                  email: input.email,
                  subject: input.subject,
                  body: input.body,
                }
              : input.type === "phone"
                ? { type: "phone" as const, phone: input.phone }
                : { type: "sms" as const, phone: input.phone, message: input.message }

    let payload: string
    try {
      payload = buildPayload(payloadInput)
    } catch (error) {
      if (error instanceof QrPayloadError) {
        throw new ToolExecutionError("VALIDATION", error.message)
      }
      throw error
    }

    const matrix = generateQrMatrix({
      input: payloadInput,
      render: {
        size: input.size,
        margin: input.margin,
        errorCorrectionLevel: input.errorCorrectionLevel,
        foreground: input.foreground,
        background: input.background,
      },
    })

    const svg = renderQrSvg(matrix, {
      foreground: input.foreground,
      background: input.background,
      size: input.size,
    })

    const scale = Math.max(1, Math.floor(input.size / matrix.size))
    const foreground = hexToRgb(input.foreground)
    const background = hexToRgb(input.background)
    const { rgba } = matrixToRgba(matrix.modules, matrix.size, scale, foreground, background)
    const renderedEdge = matrix.size * scale
    const png = encodePng(rgba, renderedEdge, renderedEdge)
    const pngDataUrl = `data:image/png;base64,${bytesToBase64(png)}`

    return {
      payload,
      svg,
      pngDataUrl,
      pngBytes: png.length,
      version: matrix.version,
      moduleSize: matrix.size,
      info: {
        mode: input.type,
        modeLabel: labelFor(input.type),
        characterCount: matrix.characterCount,
        errorCorrectionLevel: input.errorCorrectionLevel,
        renderSize: input.size,
      },
    }
  },
  summarize: {
    input: (value) => `${labelFor(value.type)} QR code generated locally`,
    output: (value) =>
      `${value.info.modeLabel} QR (v${value.version}, ${value.info.characterCount} chars)`,
  },
})

function bytesToBase64(bytes: Uint8Array): string {
  let binary = ""
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i])
  return btoa(binary)
}
