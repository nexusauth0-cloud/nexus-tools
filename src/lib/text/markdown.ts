/**
 * Markdown → safe HTML (small, deterministic subset).
 *
 * Supported syntax (documented, mirrors the tool FAQ):
 *  - ATX headings (# to ######)
 *  - paragraphs (consecutive lines joined)
 *  - emphasis *x*, strong **x**, strikethrough ~~x~~
 *  - inline code `x`, fenced code blocks ```lang
 *  - links [text](url) — schemes limited to https:, http:, mailto:,
 *    and scheme-less relative URLs; links open in a new tab with
 *    noopener/noreferrer/nofollow
 *  - images ![alt](url) — same scheme whitelist, lazy-loaded
 *  - blockquotes (> …)
 *  - unordered/ordered lists with nesting by two-space indent
 *  - pipe tables (header row + separator row + optional body rows)
 *  - horizontal rules (---, ***, ___)
 *
 * Security model:
 *  - Raw HTML is NOT supported: every character of user input is
 *    HTML-escaped before parsing, so <script> and event-handler
 *    attributes can never reach the DOM.
 *  - The output of `markdownToHtml` is safe to mount via
 *    dangerouslySetInnerHTML because it contains only tags this module
 *    itself generates plus escaped text. Marker: no input string ever
 *    appears unescaped in the output.
 *  - URLs pass through `safeUrl`: only https/http/mailto (or no scheme)
 *    are kept; javascript:, data:, vbscript:, file: are dropped.
 *
 * This is a deliberate subset — not CommonMark, no raw HTML, no
 * autolinks, no reference links, no definition lists.
 */

export const ALLOWED_URL_SCHEMES = new Set(["https:", "http:", "mailto:"])

const MAX_INLINE_LENGTH = 40_000
const MAX_INLINE_DEPTH = 12

export function markdownToHtml(markdown: string): string {
  const lines = markdown.replace(/\r\n|\r/g, "\n").split("\n")
  const blocks: string[] = []
  let index = 0

  while (index < lines.length) {
    const line = lines[index]

    if (isBlank(line)) {
      index += 1
      continue
    }

    if (isFenceStart(line)) {
      const { lang, body, next } = readFence(lines, index)
      blocks.push(
        `<pre><code${lang ? ` class="language-${escapeAttr(lang)}"` : ""}>${escapeHtml(body)}</code></pre>`
      )
      index = next
      continue
    }

    if (isHeading(line)) {
      const match = HEADING_RE.exec(line) as RegExpExecArray
      const level = match[1].length
      blocks.push(`<h${level}>${renderInline(match[2].trim())}</h${level}>`)
      index += 1
      continue
    }

    if (isHorizontalRule(line)) {
      blocks.push("<hr />")
      index += 1
      continue
    }

    if (isTableStart(lines, index)) {
      const table = readTable(lines, index)
      blocks.push(renderTable(table))
      index = table.next
      continue
    }

    if (isBlockquote(line)) {
      const quoteLines: string[] = []
      while (index < lines.length && isBlockquote(lines[index])) {
        quoteLines.push(lines[index].replace(/^\s*>\s?/, ""))
        index += 1
      }
      blocks.push(`<blockquote>${renderInline(quoteLines.join(" "))}</blockquote>`)
      continue
    }

    if (isListLine(line)) {
      const list = readList(lines, index)
      blocks.push(renderList(list.items))
      index = list.next
      continue
    }

    const paragraphLines: string[] = []
    while (
      index < lines.length &&
      !isBlank(lines[index]) &&
      !isHeading(lines[index]) &&
      !isFenceStart(lines[index]) &&
      !isHorizontalRule(lines[index]) &&
      !isListLine(lines[index]) &&
      !isBlockquote(lines[index]) &&
      !isTableStart(lines, index)
    ) {
      paragraphLines.push(lines[index].trim())
      index += 1
    }
    blocks.push(`<p>${renderInline(paragraphLines.join(" "))}</p>`)
  }

  return blocks.join("\n")
}

// ---------------------------------------------------------------------------
// Block detection
// ---------------------------------------------------------------------------

function isBlank(line: string): boolean {
  return line.trim() === ""
}

const FENCE_RE = /^```[ \t]*([A-Za-z0-9_+-]*)[ \t]*$/

function isFenceStart(line: string): boolean {
  return FENCE_RE.test(line)
}

function readFence(
  lines: readonly string[],
  start: number
): { lang: string; body: string; next: number } {
  const match = FENCE_RE.exec(lines[start]) as RegExpExecArray
  const lang = match[1]
  const body: string[] = []
  let index = start + 1
  while (index < lines.length && !FENCE_RE.test(lines[index])) {
    body.push(lines[index])
    index += 1
  }
  return { lang, body: body.join("\n"), next: index + 1 }
}

const HEADING_RE = /^(#{1,6})\s+(.*)$/

function isHeading(line: string): boolean {
  return HEADING_RE.test(line)
}

function isHorizontalRule(line: string): boolean {
  return /^(-{3,}|\*{3,}|_{3,})[ \t]*$/.test(line)
}

function isBlockquote(line: string): boolean {
  return /^\s*>\s?/.test(line)
}

// ---------------------------------------------------------------------------
// Tables
// ---------------------------------------------------------------------------

type TableAlign = "left" | "center" | "right" | null

interface Table {
  header: string[]
  aligns: TableAlign[]
  rows: string[][]
}

function splitTableRow(line: string): string[] {
  const trimmed = line.trim()
  const raw = trimmed.startsWith("|") ? trimmed.slice(1) : trimmed
  const rawEnd = raw.endsWith("|") ? raw.slice(0, -1) : raw
  return rawEnd.split("|").map((cell) => cell.trim())
}

function isTableSeparator(line: string): boolean {
  if (!line.includes("|")) return false
  const cells = splitTableRow(line)
  return (
    cells.length > 0 &&
    cells.every((cell) => cell === "" || /^:?-{1,}:?$/.test(cell.replace(/[ \t]/g, "")))
  )
}

/** A table starts with a pipe row followed by a separator row. */
function isTableStart(lines: readonly string[], index: number): boolean {
  const line = lines[index]
  return (
    line.includes("|") &&
    !isTableSeparator(line) &&
    index + 1 < lines.length &&
    isTableSeparator(lines[index + 1])
  )
}

function alignOf(cell: string): TableAlign {
  const body = cell.replace(/[ \t]/g, "")
  if (body.startsWith(":") && body.endsWith(":")) return "center"
  if (body.endsWith(":")) return "right"
  if (body.startsWith(":")) return "left"
  return null
}

function readTable(lines: readonly string[], start: number): Table & { next: number } {
  const header = splitTableRow(lines[start])
  const aligns = splitTableRow(lines[start + 1]).map(alignOf)
  const rows: string[][] = []
  let index = start + 2
  while (index < lines.length && lines[index].includes("|") && !isBlank(lines[index])) {
    rows.push(splitTableRow(lines[index]))
    index += 1
  }
  return { header, aligns, rows, next: index }
}

function renderTable(table: Table): string {
  const headCells = table.header.map(
    (cell, col) => `<th${thAttr(table.aligns[col])}>${renderInline(cell)}</th>`
  )
  const bodyRows = table.rows
    .map(
      (row) =>
        `<tr>${row
          .map((cell, col) => `<td${tdAttr(table.aligns[col])}>${renderInline(cell)}</td>`)
          .join("")}</tr>`
    )
    .join("")
  return `<table><thead><tr>${headCells.join("")}</tr></thead>${bodyRows ? `<tbody>${bodyRows}</tbody>` : ""}</table>`
}

function thAttr(align: TableAlign): string {
  return align ? ` align="${align}"` : ""
}

function tdAttr(align: TableAlign): string {
  return align ? ` align="${align}"` : ""
}

// ---------------------------------------------------------------------------
// Lists
// ---------------------------------------------------------------------------

interface ListItem {
  ordered: boolean
  content: string
  children: ListItem[]
}

type ListItemList = ListItem[]

const LIST_ITEM_RE = /^(\s*)([-*+]|\d+[.)])\s+(.*)$/

function isListLine(line: string): boolean {
  return LIST_ITEM_RE.test(line)
}

/** Read a flat sequence of (indent, content) pairs into nested lists. */
function readList(lines: readonly string[], start: number): { items: ListItemList; next: number } {
  const entries: Array<{ depth: number; ordered: boolean; content: string }> = []
  let index = start
  while (index < lines.length) {
    const match = LIST_ITEM_RE.exec(lines[index])
    if (!match) break
    const depth = Math.min(Math.floor(match[1].length / 2), 10)
    const ordered = /\d/.test(match[2])
    entries.push({ depth, ordered, content: match[3] })
    index += 1
  }
  return { items: buildList(entries), next: index }
}

function buildList(
  entries: ReadonlyArray<{ depth: number; ordered: boolean; content: string }>
): ListItemList {
  const root: ListItemList = []
  const stack: Array<{ depth: number; list: ListItemList }> = [{ depth: -1, list: root }]
  for (const entry of entries) {
    while (stack.length > 1 && stack[stack.length - 1].depth >= entry.depth) {
      stack.pop()
    }
    const item: ListItem = { ordered: entry.ordered, content: entry.content, children: [] }
    stack[stack.length - 1].list.push(item)
    stack.push({ depth: entry.depth, list: item.children })
  }
  return root
}

function renderList(list: ListItemList): string {
  const wrap = (items: ListItemList): string => {
    const ordered = items.some((item) => item.ordered)
    const tag = ordered ? "ol" : "ul"
    const rows = items
      .map((item) => {
        const child = item.children.length > 0 ? wrap(item.children) : ""
        return `<li>${renderInline(item.content)}${child}</li>`
      })
      .join("")
    return `<${tag}>${rows}</${tag}>`
  }
  return wrap(list)
}

// ---------------------------------------------------------------------------
// Inline rendering
// ---------------------------------------------------------------------------

function renderInline(text: string, depth = 0): string {
  if (text.length > MAX_INLINE_LENGTH) return escapeHtml(text)
  if (depth > MAX_INLINE_DEPTH) return escapeHtml(text)

  const out: string[] = []
  let index = 0
  const length = text.length

  while (index < length) {
    const char = text.charAt(index)

    if (char === "\\" && index + 1 < length) {
      out.push(escapeHtml(text.charAt(index + 1)))
      index += 2
      continue
    }

    if (char === "`") {
      const end = text.indexOf("`", index + 1)
      if (end !== -1) {
        out.push(`<code>${escapeHtml(text.slice(index + 1, end))}</code>`)
        index = end + 1
        continue
      }
    }

    if (char === "!" && text.charAt(index + 1) === "[") {
      const image = parseInlineLink(text, index + 1)
      if (image) {
        const { inner, url, next } = image
        const safe = safeUrl(url)
        if (safe) {
          out.push(`<img src="${escapeAttr(safe)}" alt="${escapeAttr(inner)}" loading="lazy" />`)
        } else {
          out.push(escapeHtml(text.slice(index, next)))
        }
        index = next
        continue
      }
    }

    if (char === "[") {
      const link = parseInlineLink(text, index)
      if (link) {
        const { inner, url, next } = link
        const safe = safeUrl(url)
        out.push(
          safe
            ? `<a href="${escapeAttr(safe)}" target="_blank" rel="noopener noreferrer nofollow">${renderInline(inner, depth + 1)}</a>`
            : renderInline(inner, depth + 1)
        )
        index = next
        continue
      }
    }

    if (char === "*" || char === "_") {
      const doubled = text.charAt(index + 1) === char
      const marker = doubled ? text.slice(index, index + 2) : char
      const close = text.indexOf(marker, index + marker.length)
      if (close !== -1) {
        const inner = text.slice(index + marker.length, close)
        const tag = doubled ? "strong" : "em"
        out.push(`<${tag}>${renderInline(inner, depth + 1)}</${tag}>`)
        index = close + marker.length
        continue
      }
    }

    if (char === "~" && text.charAt(index + 1) === "~") {
      const close = text.indexOf("~~", index + 2)
      if (close !== -1) {
        const inner = text.slice(index + 2, close)
        out.push(`<del>${renderInline(inner, depth + 1)}</del>`)
        index = close + 2
        continue
      }
    }

    out.push(escapeHtml(char))
    index += 1
  }

  return out.join("")
}

/** Parse "[inner](url …)" starting at the opening bracket. */
function parseInlineLink(
  text: string,
  openIndex: number
): { inner: string; url: string; next: number } | null {
  const close = text.indexOf("]", openIndex + 1)
  if (close === -1) return null
  const after = close + 1
  if (text.charAt(after) !== "(") return null
  const parenClose = text.indexOf(")", after + 1)
  if (parenClose === -1) return null
  const destination = text.slice(after + 1, parenClose).trim()
  const url = destination.split(/[ \t]+/)[0]
  if (url === "") return null
  return { inner: text.slice(openIndex + 1, close), url, next: parenClose + 1 }
}

/** Only safe schemes (or scheme-less URLs) are returned; "" means drop. */
export function safeUrl(raw: string): string {
  const candidate = raw.trim()
  const schemeMatch = /^([a-z][a-z0-9+.-]*):/i.exec(candidate)
  if (!schemeMatch) return candidate
  const scheme = schemeMatch[1].toLowerCase()
  return ALLOWED_URL_SCHEMES.has(`${scheme}:`) ? candidate : ""
}

// ---------------------------------------------------------------------------
// Escaping
// ---------------------------------------------------------------------------

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

function escapeAttr(input: string): string {
  return escapeHtml(input)
}
