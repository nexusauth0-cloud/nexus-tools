export interface CsvParseResult {
  ok: boolean
  columns: string[]
  rows: string[][]
  /** Column index (0-based) whose values are numeric on every non-empty row, or -1. */
  numericColumn?: number
  message?: string
  /** 1-based line where parsing failed, when known. */
  line?: number
  /** Column index (0-based) where parsing failed, when known. */
  column?: number
}

export const CSV_MAX_ROWS = 100_000
export const CSV_MAX_FIELDS = 100
/** Field content longer than this is truncated in the preview / converted output. */
export const CSV_MAX_FIELD_CHARS = 10_000

const CSV_DELIMITER = ","

const isNumeric = (text: string) => text !== "" && Number.isFinite(Number(text))

/**
 * Parse CSV text (RFC 4180). Never throws; reports context on failure.
 * The header row (first row) is required.
 */
export function parseCsvText(text: string): CsvParseResult {
  const rows = parseCsvRows(text)
  if (!rows.ok) {
    return {
      ok: false,
      columns: [],
      rows: [],
      message: rows.message,
      line: rows.line,
      column: rows.column,
    }
  }
  const data = rows.value
  if (data.length === 0) {
    return {
      ok: false,
      columns: [],
      rows: [],
      message: "Invalid CSV: no rows — add at least a header row.",
    }
  }
  const length = data[0]!.length
  if (length === 1 && data[0]![0] === "") {
    return { ok: false, columns: [], rows: [], message: "Invalid CSV: the header row is empty." }
  }
  for (const [index, row] of data.entries()) {
    if (row.length !== length) {
      return {
        ok: false,
        columns: [],
        rows: [],
        message: `Invalid CSV: row ${index + 1} has ${row.length} fields but the header has ${length}.`,
        line: index + 1,
      }
    }
  }
  const columns = data[0]!
  const rowsData = data.slice(1)
  const numericColumn = inferNumericColumn(columns, rowsData)
  return { ok: true, columns, rows: rowsData, numericColumn }
}

export interface CsvRowsResult {
  ok: boolean
  value: string[][]
  message?: string
  line?: number
  column?: number
}

/** Split CSV text into rows of raw fields, handling quotes and newlines. */
export function parseCsvRows(text: string): CsvRowsResult {
  const rows: string[][] = []
  let row: string[] = []
  let field = ""
  let inQuotes = false
  let line = 1
  let column = 1

  const pushField = () => {
    row.push(field)
    field = ""
  }
  const pushRow = () => {
    pushField()
    rows.push(row)
    row = []
  }

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index]!
    const next = text[index + 1]
    if (inQuotes) {
      if (char === '"' && next === '"') {
        field += '"'
        index += 1
        column += 1
      } else if (char === '"') {
        inQuotes = false
      } else if (char === "\n") {
        field += "\n"
        line += 1
        column = 1
      } else {
        field += char
      }
    } else if (char === '"' && field === "") {
      inQuotes = true
    } else if (char === CSV_DELIMITER) {
      pushField()
    } else if (char === "\n") {
      pushRow()
    } else if (char === "\r") {
      if (next === "\n") index += 1
      pushRow()
    } else {
      field += char
    }
    column += 1
  }
  if (inQuotes) {
    return {
      ok: false,
      value: [],
      message: "Invalid CSV: an unterminated quoted field — missing a closing quote.",
      line,
      column,
    }
  }
  if (field !== "" || row.length > 0) {
    pushRow()
  }
  return { ok: true, value: rows }
}

/** Choose the column whose non-empty values are all numeric, preferring the first integer-like one. */
function inferNumericColumn(columns: string[], rows: string[][]): number | undefined {
  if (rows.length === 0) return undefined
  const candidates: number[] = []
  for (let columnIndex = 0; columnIndex < columns.length; columnIndex += 1) {
    const values = rows.map((row) => row[columnIndex] ?? "")
    if (values.every((value) => isNumeric(value))) {
      candidates.push(columnIndex)
    }
  }
  if (candidates.length === 0) return undefined
  return (
    candidates.find((columnIndex) =>
      rows.every((row) => Number.isInteger(Number(row[columnIndex])))
    ) ?? candidates[0]
  )
}

/**
 * Truncate long CSV fields (row values and header labels) so previews and
 * converted JSON stay manageable. Returns new header + rows.
 */
export function truncateCsvCells(
  columns: string[],
  rows: string[][],
  maxChars: number = CSV_MAX_FIELD_CHARS
): { columns: string[]; rows: string[][] } {
  const cut = (value: string) => (value.length <= maxChars ? value : `${value.slice(0, maxChars)}…`)
  return {
    columns: columns.map(cut),
    rows: rows.map((row) => row.map(cut)),
  }
}
