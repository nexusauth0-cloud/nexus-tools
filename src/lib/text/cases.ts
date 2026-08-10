/**
 * Unicode-aware case conversion (pure, deterministic).
 *
 * Behavior (documented):
 *
 * - Only Unicode letters (\p{L}) are case-folded. Digits, punctuation,
 *   emoji, and symbols pass through unchanged — text is never destroyed.
 * - Word-boundary splitting (for camel/pascal/snake/kebab/constant/dot
 *   and slash) treats runs of letters/numbers plus internal apostrophes
 *   as words, and additionally splits on case boundaries
 *   ("camelCase" → "camel" + "Case") and letter↔digit boundaries
 *   ("value2" → "value" + "2"). Non-letter separators are dropped when
 *   joining.
 * - Title Case and Sentence case are simple, language-agnostic rules —
 *   no linguistic claim is made (e.g. "iPhone" → "Iphone").
 * - Toggle flips the case of every letter, leaving everything else as is.
 */

export type CaseMode =
  | "lower"
  | "upper"
  | "title"
  | "sentence"
  | "camel"
  | "pascal"
  | "snake"
  | "kebab"
  | "constant"
  | "dot"
  | "slash"
  | "toggle"

export const CASE_MODES: readonly CaseMode[] = [
  "lower",
  "upper",
  "title",
  "sentence",
  "camel",
  "pascal",
  "snake",
  "kebab",
  "constant",
  "dot",
  "slash",
  "toggle",
]

export const CASE_MODE_LABELS: Record<CaseMode, string> = {
  lower: "lowercase",
  upper: "UPPERCASE",
  title: "Title Case",
  sentence: "Sentence case",
  camel: "camelCase",
  pascal: "PascalCase",
  snake: "snake_case",
  kebab: "kebab-case",
  constant: "CONSTANT_CASE",
  dot: "dot.case",
  slash: "slash/case",
  toggle: "tOgGlE cAsE",
}

const LETTER_RE = /\p{L}/u

const WORD_SPLIT_RE = /[\p{L}\p{N}\p{M}]+(?:[’'][\p{L}\p{N}\p{M}]+)*/gu

/** Split text into words on separators + case/digit boundaries. */
export function splitWords(text: string): string[] {
  const matches = text.match(WORD_SPLIT_RE) ?? []
  const words: string[] = []
  for (const match of matches) {
    words.push(...splitCaseBoundaries(match))
  }
  return words
}

type CharKind = "lower" | "upper" | "digit" | "other"

function charKind(char: string): CharKind {
  if (/[\p{N}]/u.test(char)) return "digit"
  if (LETTER_RE.test(char)) return char === char.toLocaleLowerCase() ? "lower" : "upper"
  return "other"
}

/** Split a token on camelCase and letter↔digit boundaries ("HTTPServer"). */
function splitCaseBoundaries(token: string): string[] {
  const parts: string[] = []
  let start = 0
  for (let index = 1; index < token.length; index += 1) {
    const previousKind = charKind(token.charAt(index - 1))
    const currentKind = charKind(token.charAt(index))
    const nextChar = index + 1 < token.length ? token.charAt(index + 1) : ""
    const boundary =
      (previousKind === "lower" && currentKind === "upper") ||
      (previousKind === "upper" &&
        currentKind === "upper" &&
        nextChar !== "" &&
        charKind(nextChar) === "lower") ||
      ((previousKind === "lower" || previousKind === "upper") && currentKind === "digit") ||
      (previousKind === "digit" && (currentKind === "lower" || currentKind === "upper"))
    if (boundary) {
      parts.push(token.slice(start, index))
      start = index
    }
  }
  parts.push(token.slice(start))
  return parts
}

export function applyCase(mode: CaseMode, text: string): string {
  switch (mode) {
    case "lower":
      return text.toLocaleLowerCase()
    case "upper":
      return text.toLocaleUpperCase()
    case "title":
      return titleCase(text)
    case "sentence":
      return sentenceCase(text)
    case "toggle":
      return toggleCase(text)
    default:
      return joinCase(text, SEPARATOR_JOINS[mode], mode)
  }
}

const SEPARATOR_JOINS: Record<string, string> = {
  camel: "",
  pascal: "",
  snake: "_",
  kebab: "-",
  constant: "_",
  dot: ".",
  slash: "/",
}

/** Simple rule: every word capitalized, remaining letters lowercased. */
export function titleCase(text: string): string {
  let result = ""
  let inWord = false
  for (const char of text) {
    if (LETTER_RE.test(char) || /[\p{N}]/u.test(char)) {
      if (!inWord) {
        result += char.toLocaleUpperCase()
        inWord = true
      } else if (LETTER_RE.test(char)) {
        result += char.toLocaleLowerCase()
      } else {
        result += char
      }
    } else {
      result += char
      // Apostrophes keep a word together ("Don't" stays one word).
      inWord = char === "'" || char === "’"
    }
  }
  return result
}

/** Simple rule: first letter after a sentence break is capitalized. */
export function sentenceCase(text: string): string {
  let result = ""
  let capitalizeNext = true
  let pendingBreak = false
  for (const char of text) {
    if (LETTER_RE.test(char)) {
      result += capitalizeNext ? char.toLocaleUpperCase() : char.toLocaleLowerCase()
      capitalizeNext = false
      pendingBreak = false
    } else {
      result += char
      if (isTerminalPunctuation(char)) {
        pendingBreak = true
      } else if (/\s/u.test(char) && pendingBreak) {
        capitalizeNext = true
        pendingBreak = false
      } else if (char === "\n") {
        capitalizeNext = true
        pendingBreak = false
      }
    }
  }
  return result
}

function isTerminalPunctuation(char: string): boolean {
  return /[.!?…。！？]/.test(char)
}

/** Flip the case of every letter; everything else passes through. */
export function toggleCase(text: string): string {
  let result = ""
  for (const char of text) {
    if (!LETTER_RE.test(char)) {
      result += char
    } else if (char === char.toLocaleUpperCase()) {
      result += char.toLocaleLowerCase()
    } else {
      result += char.toLocaleUpperCase()
    }
  }
  return result
}

function joinCase(
  text: string,
  separator: string,
  mode: Exclude<CaseMode, "lower" | "upper" | "title" | "sentence" | "toggle">
): string {
  const words = splitWords(text)
  if (words.length === 0) return ""
  const folded = words.map((word) => word.toLocaleLowerCase())
  const capitalized = folded.map((word, index) => {
    if (mode === "constant") return word.toLocaleUpperCase()
    if (mode === "pascal") return capitalizeWord(word)
    if (mode === "camel" && index > 0) return capitalizeWord(word)
    return word
  })
  return capitalized.join(separator)
}

function capitalizeWord(word: string): string {
  const letterIndex = indexOfLetter(word)
  if (letterIndex === -1) return word
  return (
    word.slice(0, letterIndex) +
    word.charAt(letterIndex).toLocaleUpperCase() +
    word.slice(letterIndex + 1).toLocaleLowerCase()
  )
}

function indexOfLetter(word: string): number {
  for (let index = 0; index < word.length; index += 1) {
    if (LETTER_RE.test(word.charAt(index))) return index
  }
  return -1
}
