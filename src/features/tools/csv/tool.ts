import { CSV_MAX_FIELD_CHARS, parseCsvText, truncateCsvCells } from "@/lib/data/csv"
import { registerDecoration } from "@/lib/registry/artwork"

/**
 * CSV → JSON converter. Parses RFC 4180 with a required header row, then
 * emits an array of row objects (or a single object for one-row files).
 * Long cells are truncated (marked with …) so output stays manageable.
 */

export interface CsvToolResult {
  ok: boolean
  output: string
  blocks?: Array<{ label?: string; text: string; code?: boolean }>
  info?: Record<string, string>
  line?: number
  column?: number
}

export function run(input: string): CsvToolResult {
  const parsed = parseCsvText(input)
  if (!parsed.ok) {
    return { ok: false, output: parsed.message ?? "", line: parsed.line, column: parsed.column }
  }

  const { columns, rows } = truncateCsvCells(parsed.columns, parsed.rows, CSV_MAX_FIELD_CHARS)
  const objects = rows.map((row) => {
    const record: Record<string, string> = {}
    columns.forEach((header, index) => {
      record[header] = row[index] ?? ""
    })
    return record
  })

  const output = JSON.stringify(rows.length === 1 ? objects[0] : objects, null, 2)

  const previewRows = rows.slice(0, 5).map((row) => row.join(", "))
  const preview = [columns.join(", "), ...previewRows].join("\n")

  return {
    ok: true,
    output,
    blocks: [{ label: "Preview", text: preview, code: true }],
    info: {
      columns: String(columns.length),
      rows: String(rows.length),
      numericColumn:
        parsed.numericColumn !== undefined ? (columns[parsed.numericColumn] ?? "–") : "–",
    },
  }
}

registerDecoration(
  "csv",
  [
    "   name      , votes",
    "   ─────────────────",
    "   Alice     , 3    ",
    "   Bob       , 5    ",
    "   →  [ { name, votes } … ]",
  ].join("\n")
)

export const helpArt: string = [
  "╔══════════════════════════════════════╗",
  "║         CSV → JSON converter        ║",
  "╚══════════════════════════════════════╝",
].join("\n")
