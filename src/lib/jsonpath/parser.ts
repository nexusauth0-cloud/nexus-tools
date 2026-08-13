import {
  JsonPathError,
  JSONPATH_MAX_EXPRESSION_CHARS,
  type FilterExpression,
  type FilterOperand,
  type JsonPathNode,
} from "./types"

/**
 * Recursive-descent parser for the supported JSONPath subset.
 *
 * Grammar (documented; see the tool manifest for the full reference):
 *
 *   expression := '$' segments
 *   segments   := ( '.' name | '.*' | '[' selector ']' | '..' name | '..*' | '..' '[' selector ']' )*
 *   selector   := quotedString | integer | '*' | slice | union | filter
 *   slice      := int? ':' int? (':' int?)?
 *   union      := (quotedString | integer) (',' (quotedString | integer))+
 *   filter     := '?(' orExpr ')'
 *   orExpr     := andExpr ( '||' andExpr )*
 *   andExpr    := notExpr ( '&&' notExpr )*
 *   notExpr    := '!' notExpr | '(' orExpr ')' | comparison
 *   comparison := operand ( ('=='|'!='|'<='|'>='|'<'|'>') operand )?
 *   operand    := literal | '@' ( '.' name | '[' quotedString ']' | '[' integer ']' )*
 *
 * No eval, Function, or dynamic execution anywhere: the parsed AST is data
 * consumed by the evaluator. Unsupported constructs fail at parse time with
 * a clear SYNTAX error (never silently ignored).
 */

class Scanner {
  index = 0
  constructor(readonly source: string) {}

  peek(offset = 0): string {
    return this.source[this.index + offset] ?? ""
  }

  next(): string {
    return this.source[this.index++] ?? ""
  }

  eof(): boolean {
    return this.index >= this.source.length
  }

  startsWith(text: string): boolean {
    return this.source.startsWith(text, this.index)
  }

  error(message: string): never {
    throw new JsonPathError("SYNTAX", `${message} (at character ${this.index + 1}).`)
  }
}

export function parseJsonPath(expression: string): JsonPathNode {
  const source = expression.trim()
  if (source.length === 0) throw new JsonPathError("SYNTAX", "JSONPath expression is empty.")
  if (source.length > JSONPATH_MAX_EXPRESSION_CHARS) {
    throw new JsonPathError(
      "SYNTAX",
      `JSONPath expression is too long (${source.length} characters, max ${JSONPATH_MAX_EXPRESSION_CHARS}).`
    )
  }

  const s = new Scanner(source)
  if (s.next() !== "$") s.error('JSONPath expressions must start with "$".')

  const root: JsonPathNode = { kind: "root", next: null }
  let tail: JsonPathNode = root

  while (!s.eof()) {
    const char = s.peek()

    if (char === "." && s.peek(1) === ".") {
      s.next()
      s.next()
      if (s.eof()) s.error('Expected a name, "*", or "[" after "..".')
      const inner: JsonPathNode =
        s.peek() === "*"
          ? { kind: "wildcard", next: null }
          : s.peek() === "["
            ? parseBracketSelector(s)
            : { kind: "child", name: readName(s), next: null }
      const node: JsonPathNode = { kind: "recursive", selector: inner, next: null }
      tail.next = node
      tail = node
      continue
    }

    if (char === ".") {
      s.next()
      if (s.eof()) s.error('Expected a property name after ".".')
      const node: JsonPathNode =
        s.peek() === "*"
          ? { kind: "wildcard", next: null }
          : { kind: "child", name: readName(s), next: null }
      if (s.peek() === "*") s.next()
      tail.next = node
      tail = node
      continue
    }

    if (char === "[") {
      s.next()
      const node = parseBracketSelector(s)
      tail.next = node
      tail = node
      continue
    }

    s.error(`Unexpected character "${char}".`)
  }

  return root
}

function readName(s: Scanner): string {
  const start = s.index
  while (!s.eof() && !/[\s.\[\]'"(),:&|!]/.test(s.peek())) s.next()
  if (s.index === start) s.error(`Expected a property name, found "${s.peek()}".`)
  return s.source.slice(start, s.index)
}

function parseBracketSelector(s: Scanner): JsonPathNode {
  const start = s.index

  if (s.peek() === "*") {
    s.next()
    expectBracketClose(s)
    return { kind: "wildcard", next: null }
  }

  if (s.peek() === "?") {
    s.next()
    if (s.next() !== "(") s.error('Expect "(" after "?" in [?(...)] filter.')
    const expression = parseOrExpression(s)
    if (s.next() !== ")") s.error('Expected ")" to close filter expression.')
    expectBracketClose(s)
    return { kind: "filter", expression, next: null }
  }

  if (peekSlice(s)) {
    const node = parseSlice(s)
    expectBracketClose(s)
    return node
  }

  const first = tryReadNumberOrQuoted(s)
  if (first !== null) {
    if (s.peek() === ",") {
      const members = [first]
      while (s.peek() === ",") {
        s.next()
        const member = tryReadNumberOrQuoted(s)
        if (member === null) s.error('Expected a number or quoted name after "," in a union.')
        members.push(member)
      }
      expectBracketClose(s)
      return { kind: "union", members, next: null }
    }
    expectBracketClose(s)
    return typeof first === "number"
      ? { kind: "index", index: first, next: null }
      : { kind: "child", name: first, next: null }
  }

  throw new JsonPathError(
    "SYNTAX",
    `Unsupported selector inside "[" at character ${start + 1}. Supported: name, index, [*], [start:end:step], [a,b] unions and [?()] filters.`
  )
}

/** Peek whether the bracket content is a slice (optional int, then ':'). */
function peekSlice(s: Scanner): boolean {
  const save = s.index
  if (s.peek() === "-") s.next()
  while (/[0-9]/.test(s.peek())) s.next()
  const isSlice = s.peek() === ":"
  s.index = save
  return isSlice
}

function parseSlice(s: Scanner): Extract<JsonPathNode, { kind: "slice" }> {
  const start = readOptionalInt(s)
  if (s.next() !== ":") s.error('Expected ":" in slice expression.')
  const end = readOptionalInt(s)
  let step = 1
  if (s.peek() === ":") {
    s.next()
    step = readOptionalInt(s) ?? 1
  }
  if (step === 0) s.error("Slice step cannot be zero.")
  return { kind: "slice", start, end, step, next: null }
}

function readOptionalInt(s: Scanner): number | null {
  if (s.peek() !== "-" && !/[0-9]/.test(s.peek())) return null
  let negative = false
  if (s.peek() === "-") {
    s.next()
    negative = true
  }
  let digits = ""
  while (/[0-9]/.test(s.peek())) digits += s.next()
  if (digits === "") s.error("Invalid number in expression.")
  return (negative ? -1 : 1) * Number(digits)
}

function readQuoted(s: Scanner): string {
  const quote = s.next()
  let value = ""
  while (!s.eof()) {
    const char = s.next()
    if (char === "\\") {
      value += s.next()
      continue
    }
    if (char === quote) return value
    value += char
  }
  s.error("Unterminated string in expression.")
}

function tryReadNumberOrQuoted(s: Scanner): string | number | null {
  if (s.peek() === "'" || s.peek() === '"') return readQuoted(s)
  const start = s.index
  const value = readOptionalInt(s)
  if (value === null) {
    s.index = start
    return null
  }
  return value
}

function expectBracketClose(s: Scanner): void {
  if (s.next() !== "]") s.error('Expected "]" to close bracket selector.')
}

// ---- Filter expressions ---------------------------------------------------------

function parseOrExpression(s: Scanner): FilterExpression {
  let left = parseAndExpression(s)
  while (true) {
    skipWhitespace(s)
    if (!s.startsWith("||")) break
    s.next()
    s.next()
    left = { kind: "or", left, right: parseAndExpression(s) }
  }
  return left
}

function parseAndExpression(s: Scanner): FilterExpression {
  let left = parseNotExpression(s)
  while (true) {
    skipWhitespace(s)
    if (!s.startsWith("&&")) break
    s.next()
    s.next()
    left = { kind: "and", left, right: parseNotExpression(s) }
  }
  return left
}

function parseNotExpression(s: Scanner): FilterExpression {
  skipWhitespace(s)
  if (s.peek() === "!") {
    s.next()
    return { kind: "not", operand: parseNotExpression(s) }
  }
  if (s.peek() === "(") {
    s.next()
    skipWhitespace(s)
    const inner = parseOrExpression(s)
    skipWhitespace(s)
    if (s.next() !== ")") s.error('Expected ")" in filter expression.')
    return inner
  }
  return parseComparison(s)
}

function skipWhitespace(s: Scanner): void {
  while (s.peek() === " " || s.peek() === "\t") s.next()
}

const COMPARE_OPS = ["==", "!=", "<=", ">=", "<", ">"] as const

function parseComparison(s: Scanner): FilterExpression {
  const left = parseOperand(s)
  skipWhitespace(s)
  for (const op of COMPARE_OPS) {
    if (s.startsWith(op)) {
      for (let i = 0; i < op.length; i++) s.next()
      const right = parseOperand(s)
      return { kind: "compare", op, left, right }
    }
  }
  return { kind: "truthy", operand: left }
}

function parseOperand(s: Scanner): FilterOperand {
  skipWhitespace(s)
  const c = s.peek()

  if (c === "'" || c === '"') return { kind: "literal", value: readQuoted(s) }
  if (c === "-" || /[0-9]/.test(c)) {
    const value = readOptionalInt(s)
    if (value === null) s.error("Invalid number in filter expression.")
    return { kind: "literal", value }
  }
  if (s.startsWith("true")) {
    consumeWord(s, "true")
    return { kind: "literal", value: true }
  }
  if (s.startsWith("false")) {
    consumeWord(s, "false")
    return { kind: "literal", value: false }
  }
  if (s.startsWith("null")) {
    consumeWord(s, "null")
    return { kind: "literal", value: null }
  }
  if (c === "@") {
    s.next()
    const segments: Array<{ kind: "name"; name: string } | { kind: "index"; index: number }> = []
    while (true) {
      if (s.peek() === ".") {
        s.next()
        if (s.peek() === "*") s.error('"@.*" is not supported in filters; use @.name or @["name"].')
        const name = readName(s)
        segments.push({ kind: "name", name })
      } else if (s.peek() === "[") {
        s.next()
        const member = tryReadNumberOrQuoted(s)
        if (member === null)
          s.error("Only names and indices are supported inside @[..] in filters.")
        expectBracketClose(s)
        segments.push(
          typeof member === "number"
            ? { kind: "index", index: member }
            : { kind: "name", name: member }
        )
      } else {
        break
      }
    }
    return { kind: "path", segments }
  }
  throw new JsonPathError(
    "SYNTAX",
    `Unsupported token "${c}" in filter expression. Filters support literals, @ paths, comparisons, &&, ||, ! and parentheses.`
  )
}

function consumeWord(s: Scanner, word: string): void {
  for (let i = 0; i < word.length; i++) {
    if (s.next() !== word[i]) s.error(`Invalid token near "${word}".`)
  }
}
