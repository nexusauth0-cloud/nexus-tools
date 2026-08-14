import { z } from "zod"
import { createToolEngine, summarize, textField, ToolExecutionError } from "@/lib/tool-engine"
import { CSV_MAX_FIELD_CHARS, parseCsvText, truncateCsvCells } from "@/lib/data/csv"

/**
 * CSV → JSON converter engine.
 *
 * Parses RFC 4180 with a required header row, then emits an array of row
 * objects (or a single object for one-row files). Long cells are
 * truncated (marked with …) so output stays manageable, and a small
 * preview plus row/column counts ride along in the output.
 */

export interface CsvInput {
  csv: string
}

export interface CsvOutput {
  /** JSON array of row objects (or a single object for one-row files). */
  text: string
  /** Header + first five rows, comma-joined, for the preview block. */
  preview: string
  columns: number
  rows: number
  numericColumn: string | null
}

const schema = z.object({
  csv: textField({ min: 1, max: undefined }),
})

export const csvEngine = createToolEngine<typeof schema, CsvOutput>({
  toolId: "csv",
  schema,
  process: ({ csv }) => {
    const parsed = parseCsvText(csv)
    if (!parsed.ok) {
      throw new ToolExecutionError("VALIDATION", parsed.message ?? "Invalid CSV input")
    }

    const { columns, rows } = truncateCsvCells(parsed.columns, parsed.rows, CSV_MAX_FIELD_CHARS)
    const objects = rows.map((row) => {
      const record: Record<string, string> = {}
      columns.forEach((header, index) => {
        record[header] = row[index] ?? ""
      })
      return record
    })

    const text = JSON.stringify(rows.length === 1 ? objects[0] : objects, null, 2)

    const previewRows = rows.slice(0, 5).map((row) => row.join(", "))
    const preview = [columns.join(", "), ...previewRows].join("\n")

    return {
      text,
      preview,
      columns: columns.length,
      rows: rows.length,
      numericColumn:
        parsed.numericColumn === undefined ? null : (columns[parsed.numericColumn] ?? null),
    }
  },
  summarize: {
    input: (value) => summarize(value.csv),
    output: (value) =>
      `${value.rows} row${value.rows === 1 ? "" : "s"} → ${value.columns} column${value.columns === 1 ? "" : "s"}`,
  },
})
