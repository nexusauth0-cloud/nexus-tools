/**
 * Export engine.
 *
 * A pluggable registry maps a format id to a compile function. Every tool
 * reuses the same serialization + download path; adding a format is a
 * single `registerExporter` call.
 */

export const EXPORT_FORMATS = ["txt", "json", "csv", "html", "md"] as const
export type ExportFormat = (typeof EXPORT_FORMATS)[number]

export interface ExportOptions {
  /** Pretty-print when the format supports it. */
  pretty?: boolean
  /** CSV field separator (default ","). */
  delimiter?: string
  /** Document title for html/md. */
  title?: string
  /** Fence language for md (default "text"). */
  language?: string
}

export interface ToolExporter<F extends ExportFormat = ExportFormat> {
  format: F
  label: string
  mime: string
  extension: string
  compile: (value: unknown, options: ExportOptions) => string
}

export interface FormattedExport {
  format: string
  label: string
  mime: string
  extension: string
  content: string
}

const exporters = new Map<string, ToolExporter>()

export function registerExporter<F extends ExportFormat>(exporter: ToolExporter<F>): void {
  exporters.set(exporter.format, exporter)
}

export function getExporter(format: string): ToolExporter | undefined {
  return exporters.get(format)
}

export function availableExports(): ToolExporter[] {
  return Array.from(exporters.values())
}

export function extensionFor(format: string): string {
  return getExporter(format)?.extension ?? format
}

export function mimeFor(format: string): string {
  return getExporter(format)?.mime ?? "text/plain"
}

export function labelFor(format: string): string {
  return getExporter(format)?.label ?? format
}

/** Compile a tool output into a downloadable artifact. */
export function formatExport(
  format: ExportFormat,
  value: unknown,
  options: ExportOptions = {}
): FormattedExport {
  const exporter = getExporter(format)
  if (!exporter) {
    throw new Error(`No exporter registered for "${format}".`)
  }
  return {
    format: exporter.format,
    label: exporter.label,
    mime: exporter.mime,
    extension: exporter.extension,
    content: exporter.compile(value, options),
  }
}

// ---------------------------------------------------------------------------
// Built-in formats
// ---------------------------------------------------------------------------

function asText(value: unknown): string {
  return typeof value === "string" ? value : JSON.stringify(value, null, 2)
}

registerExporter<"txt">({
  format: "txt",
  label: "Plain text",
  mime: "text/plain",
  extension: "txt",
  compile: (value) => asText(value),
})

registerExporter<"json">({
  format: "json",
  label: "JSON",
  mime: "application/json",
  extension: "json",
  compile: (value, options) =>
    JSON.stringify(value, null, options.pretty === false ? undefined : 2),
})

registerExporter<"csv">({
  format: "csv",
  label: "CSV",
  mime: "text/csv",
  extension: "csv",
  compile: (value, options) => compileCsv(value, options.delimiter ?? ","),
})

registerExporter<"html">({
  format: "html",
  label: "HTML",
  mime: "text/html",
  extension: "html",
  compile: (value, options) => compileHtml(value, options.title ?? "NEXUS Tools export"),
})

registerExporter<"md">({
  format: "md",
  label: "Markdown",
  mime: "text/markdown",
  extension: "md",
  compile: (value, options) => `\`\`\`${options.language ?? "text"}\n${asText(value)}\n\`\`\`\n`,
})

// ---------------------------------------------------------------------------
// Format helpers
// ---------------------------------------------------------------------------

function compileCsv(value: unknown, delimiter: string): string {
  if (typeof value === "string") return value
  if (!Array.isArray(value)) return JSON.stringify(value)

  const first = value[0]
  if (Array.isArray(first)) {
    return (value as unknown[][]).map((row) => serializeCsvRow(row, delimiter)).join("\n")
  }

  if (isRecord(first)) {
    const records = value as Record<string, unknown>[]
    const columns = Object.keys(first)
    const header = serializeCsvRow(columns, delimiter)
    const rows = records.map((record) =>
      serializeCsvRow(
        columns.map((column) => record[column]),
        delimiter
      )
    )
    return [header, ...rows].join("\n")
  }

  return serializeCsvRow(value as unknown[], delimiter)
}

function serializeCsvRow(row: readonly unknown[], delimiter: string): string {
  return row
    .map((cell) => {
      const text = cell == null ? "" : String(cell)
      return text.includes(delimiter) || text.includes('"') || text.includes("\n")
        ? `"${text.replace(/"/g, '""')}"`
        : text
    })
    .join(delimiter)
}

function compileHtml(value: unknown, title: string): string {
  const escaped = escapeHtml(asText(value))
  return [
    "<!doctype html>",
    `<html lang="en">`,
    "<head>",
    '<meta charset="utf-8" />',
    `<title>${escapeHtml(title)}</title>`,
    "<style>",
    "body{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;line-height:1.5;margin:2rem;color:#1f2937}",
    "pre{white-space:pre-wrap;word-break:break-word}",
    "</style>",
    "</head>",
    `<body><main><pre>${escaped}</pre></main></body>`,
    "</html>",
    "",
  ].join("\n")
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

// ---------------------------------------------------------------------------
// Client-side download helper
// ---------------------------------------------------------------------------

/** Trigger a browser download for already-compiled content. */
export function downloadExport(artifact: FormattedExport, stem: string): void {
  if (typeof document === "undefined") return
  const blob = new Blob([artifact.content], { type: artifact.mime })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = `${stem}.${artifact.extension}`
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  URL.revokeObjectURL(url)
}
