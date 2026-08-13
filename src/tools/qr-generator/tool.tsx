"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { CodeEditor } from "@/components/tool/inputs/code-editor"
import { Segmented } from "@/components/tool/inputs/segmented"
import { ErrorAlert } from "@/components/tool/outputs/error-alert"
import { ResetButton } from "@/components/tool/outputs/reset-button"
import { useTool } from "@/lib/tool-engine"
import { Download } from "lucide-react"
import { qrGeneratorEngine, QR_MODE_OPTIONS } from "./engine"
import { manifest } from "./manifest"
import { QR_DEFAULT_RENDER_SIZE, QR_MAX_RENDER_SIZE } from "@/lib/qr"
import type { QrContentType, QrErrorCorrectionLevel, WifiSecurity } from "@/lib/qr"

const SIZE_OPTIONS = [256, 384, 512, 768, 1024].filter((s) => s <= QR_MAX_RENDER_SIZE)
const EC_OPTIONS: Array<{ value: QrErrorCorrectionLevel; label: string }> = [
  { value: "L", label: "L — low (7%)" },
  { value: "M", label: "M — medium (15%)" },
  { value: "Q", label: "Q — quartile (25%)" },
  { value: "H", label: "H — high (30%)" },
]

interface ModeForm {
  type: QrContentType
  text: string
  url: string
  ssid: string
  password: string
  security: WifiSecurity
  hidden: boolean
  email: string
  subject: string
  body: string
  phone: string
  message: string
}

export default function QrGenerator() {
  const [form, setForm] = React.useState<ModeForm>({
    type: "url",
    text: "",
    url: "",
    ssid: "",
    password: "",
    security: "WPA",
    hidden: false,
    email: "",
    subject: "",
    body: "",
    phone: "",
    message: "",
  })
  const [size, setSize] = React.useState(QR_DEFAULT_RENDER_SIZE)
  const [margin, setMargin] = React.useState(2)
  const [errorCorrectionLevel, setErrorCorrectionLevel] =
    React.useState<QrErrorCorrectionLevel>("M")
  const [foreground, setForeground] = React.useState("#000000")
  const [background, setBackground] = React.useState("#ffffff")

  const { status, result, error, run, reset } = useTool(qrGeneratorEngine)
  const busy = status === "validating" || status === "processing"
  const errorId = `${manifest.slug}-error`

  const set = <K extends keyof ModeForm>(key: K, value: ModeForm[K]) =>
    setForm((previous) => ({ ...previous, [key]: value }))

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    void run({
      type: form.type,
      text: form.text,
      url: form.url,
      ssid: form.ssid,
      password: form.password,
      security: form.security,
      hidden: form.hidden,
      email: form.email,
      subject: form.subject,
      body: form.body,
      phone: form.phone,
      message: form.message,
      size,
      margin,
      errorCorrectionLevel,
      foreground,
      background,
    })
  }

  const handleReset = () => {
    reset()
    setForm({
      type: form.type,
      text: "",
      url: "",
      ssid: "",
      password: "",
      security: "WPA",
      hidden: false,
      email: "",
      subject: "",
      body: "",
      phone: "",
      message: "",
    })
    setSize(QR_DEFAULT_RENDER_SIZE)
    setMargin(2)
    setErrorCorrectionLevel("M")
    setForeground("#000000")
    setBackground("#ffffff")
  }

  const output = result?.output
  const inputReady =
    form.type === "text"
      ? form.text.trim() !== ""
      : form.type === "url"
        ? form.url.trim() !== ""
        : form.type === "wifi"
          ? form.ssid.trim() !== ""
          : form.type === "email"
            ? form.email.trim() !== ""
            : form.phone.trim() !== "" // phone and SMS both need a phone number

  const downloadPng = () => {
    if (!output) return
    const anchor = document.createElement("a")
    anchor.href = output.pngDataUrl
    anchor.download = `qr-code-${Date.now()}.png`
    document.body.appendChild(anchor)
    anchor.click()
    document.body.removeChild(anchor)
  }

  const downloadSvg = () => {
    if (!output) return
    const blob = new Blob([output.svg], { type: "image/svg+xml" })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download = `qr-code-${Date.now()}.svg`
    document.body.appendChild(anchor)
    anchor.click()
    document.body.removeChild(anchor)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-5"
        noValidate
        aria-label="QR code form"
      >
        <Segmented<QrContentType>
          label="Content type"
          options={QR_MODE_OPTIONS}
          value={form.type}
          onChange={(value) => set("type", value)}
        />

        {form.type === "text" ? (
          <CodeEditor
            id={`${manifest.slug}-text`}
            label="Text to encode"
            placeholder="Any text — Unicode, emoji, CJK and Arabic are supported."
            value={form.text}
            onChange={(event) => set("text", event.target.value)}
            showCount
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? errorId : undefined}
          />
        ) : null}

        {form.type === "url" ? (
          <div className="flex flex-col gap-2">
            <Label htmlFor={`${manifest.slug}-url`}>URL</Label>
            <Input
              id={`${manifest.slug}-url`}
              type="text"
              inputMode="url"
              placeholder="https://example.com/path?q=1"
              value={form.url}
              onChange={(event) => set("url", event.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              The URL is stored as QR data — its reachability is never checked.
            </p>
          </div>
        ) : null}

        {form.type === "wifi" ? (
          <>
            <div className="flex flex-col gap-2">
              <Label htmlFor={`${manifest.slug}-ssid`}>Network name (SSID)</Label>
              <Input
                id={`${manifest.slug}-ssid`}
                type="text"
                autoComplete="off"
                placeholder="MyNetwork"
                value={form.ssid}
                onChange={(event) => set("ssid", event.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor={`${manifest.slug}-security`}>Security</Label>
              <Select
                value={form.security}
                onValueChange={(value) => set("security", value as WifiSecurity)}
              >
                <SelectTrigger id={`${manifest.slug}-security`} aria-label="Wi-Fi security">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="WPA">WPA / WPA2</SelectItem>
                  <SelectItem value="WEP">WEP</SelectItem>
                  <SelectItem value="nopass">Open network</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {form.security !== "nopass" ? (
              <div className="flex flex-col gap-2">
                <Label htmlFor={`${manifest.slug}-password`}>Password</Label>
                <Input
                  id={`${manifest.slug}-password`}
                  type="password"
                  autoComplete="new-password"
                  placeholder="Network password"
                  value={form.password}
                  onChange={(event) => set("password", event.target.value)}
                />
              </div>
            ) : null}
            <div className="flex items-center justify-between gap-3">
              <Label htmlFor={`${manifest.slug}-hidden`}>Hidden network</Label>
              <Switch
                id={`${manifest.slug}-hidden`}
                checked={form.hidden}
                onCheckedChange={(checked) => set("hidden", checked)}
              />
            </div>
          </>
        ) : null}

        {form.type === "email" ? (
          <>
            <div className="flex flex-col gap-2">
              <Label htmlFor={`${manifest.slug}-email`}>Email address</Label>
              <Input
                id={`${manifest.slug}-email`}
                type="email"
                autoComplete="off"
                placeholder="name@example.com"
                value={form.email}
                onChange={(event) => set("email", event.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor={`${manifest.slug}-subject`}>Subject (optional)</Label>
              <Input
                id={`${manifest.slug}-subject`}
                type="text"
                value={form.subject}
                onChange={(event) => set("subject", event.target.value)}
              />
            </div>
            <CodeEditor
              id={`${manifest.slug}-body`}
              label="Body (optional)"
              placeholder="Message body"
              value={form.body}
              onChange={(event) => set("body", event.target.value)}
              className="min-h-24"
            />
          </>
        ) : null}

        {form.type === "phone" ? (
          <div className="flex flex-col gap-2">
            <Label htmlFor={`${manifest.slug}-phone`}>Phone number</Label>
            <Input
              id={`${manifest.slug}-phone`}
              type="tel"
              inputMode="tel"
              placeholder="+1 555 123 4567"
              value={form.phone}
              onChange={(event) => set("phone", event.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Encoded as tel: — scanning offers a call, nothing is dialed here.
            </p>
          </div>
        ) : null}

        {form.type === "sms" ? (
          <>
            <div className="flex flex-col gap-2">
              <Label htmlFor={`${manifest.slug}-sms-phone`}>Phone number</Label>
              <Input
                id={`${manifest.slug}-sms-phone`}
                type="tel"
                inputMode="tel"
                placeholder="+1 555 123 4567"
                value={form.phone}
                onChange={(event) => set("phone", event.target.value)}
              />
            </div>
            <CodeEditor
              id={`${manifest.slug}-sms-message`}
              label="Message (optional)"
              placeholder="Pre-filled SMS text"
              value={form.message}
              onChange={(event) => set("message", event.target.value)}
              className="min-h-24"
            />
          </>
        ) : null}

        <fieldset className="grid grid-cols-2 gap-4">
          <legend className="sr-only">QR appearance</legend>
          <div className="flex flex-col gap-2">
            <Label htmlFor={`${manifest.slug}-size`}>Image size</Label>
            <Select value={String(size)} onValueChange={(value) => setSize(Number(value))}>
              <SelectTrigger id={`${manifest.slug}-size`} aria-label="QR image size">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SIZE_OPTIONS.map((option) => (
                  <SelectItem key={option} value={String(option)}>
                    {option}×{option} px
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor={`${manifest.slug}-ec`}>Error correction</Label>
            <Select
              value={errorCorrectionLevel}
              onValueChange={(value) => setErrorCorrectionLevel(value as QrErrorCorrectionLevel)}
            >
              <SelectTrigger id={`${manifest.slug}-ec`} aria-label="Error correction level">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EC_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor={`${manifest.slug}-margin`}>Quiet zone (modules)</Label>
            <Input
              id={`${manifest.slug}-margin`}
              type="number"
              inputMode="numeric"
              min={0}
              max={8}
              value={margin}
              onChange={(event) => setMargin(Number(event.target.value))}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor={`${manifest.slug}-colors`}>Colors</Label>
            <div className="flex items-center gap-2">
              <Input
                id={`${manifest.slug}-colors`}
                type="color"
                value={foreground}
                onChange={(event) => setForeground(event.target.value)}
                aria-label="Foreground color"
                className="h-10 w-12 cursor-pointer px-1"
              />
              <span className="text-sm text-muted-foreground">on</span>
              <Input
                type="color"
                value={background}
                onChange={(event) => setBackground(event.target.value)}
                aria-label="Background color"
                className="h-10 w-12 cursor-pointer px-1"
              />
            </div>
          </div>
        </fieldset>

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={busy || !inputReady}>
            {busy ? "Generating…" : "Generate QR code"}
          </Button>
          <ResetButton onClick={handleReset} disabled={busy || (result === null && !error)} />
        </div>

        <div id={errorId}>
          <ErrorAlert error={error} />
        </div>
      </form>

      <div className="flex flex-col gap-5">
        {output ? (
          <div className="flex flex-col items-center gap-4 rounded-xl border border-border bg-background/60 p-6">
            <img
              src={output.pngDataUrl}
              alt="Generated QR code preview"
              width={output.info.renderSize}
              height={output.info.renderSize}
              className="h-auto max-w-full rounded-lg"
            />
            <dl className="grid w-full grid-cols-2 gap-2 text-sm">
              <div>
                <dt className="text-xs text-muted-foreground">Content</dt>
                <dd className="font-medium">{output.info.modeLabel}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Characters</dt>
                <dd className="font-medium">{output.info.characterCount}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">QR version</dt>
                <dd className="font-medium">
                  v{output.version} ({output.moduleSize} modules)
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Error correction</dt>
                <dd className="font-medium">{output.info.errorCorrectionLevel}</dd>
              </div>
            </dl>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Button type="button" variant="outline" size="sm" onClick={downloadPng}>
                <Download />
                Download PNG
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={downloadSvg}>
                <Download />
                Download SVG
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              PNG {Math.round(output.pngBytes / 1024)} KB — generated locally, nothing uploaded.
            </p>
          </div>
        ) : (
          <div className="flex min-h-64 items-center justify-center rounded-xl border border-dashed border-border bg-background/40 p-6 text-sm text-muted-foreground">
            Your QR code appears here after generation.
          </div>
        )}
      </div>
    </div>
  )
}
