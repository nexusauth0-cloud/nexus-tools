/**
 * Unicode-aware text statistics (pure, deterministic, dependency-free).
 *
 * Counting rules (documented, and stated in the tool UI):
 *
 * - characters: Unicode code points (surrogate pairs count as one
 *   character). Combining marks are distinct code points and are counted
 *   individually — this is the standard definition, not typography.
 * - charactersExcludingSpaces: code points that are not whitespace.
 * - words: runs of letters/marks/numbers, with internal apostrophes and
 *   hyphens kept inside a token ("don't", "well-known" = 1 word each).
 *   CJK behaves differently: each CJK ideograph counts as one word,
 *   because CJK scripts do not use whitespace-separated words. This is a
 *   documented simplification, not a linguistic claim.
 * - sentences: estimated by runs of terminal punctuation (. ! ? … and CJK
 *   。！？) followed by whitespace or end of text. An estimate only.
 * - paragraphs: blocks of text separated by one or more blank lines.
 * - lines: segments separated by \n (CRLF normalized).
 * - whitespace: count of whitespace code points.
 * - bytes: length of the UTF-8 encoding.
 *
 * Reading/speaking time are estimates based on documented average rates
 * (220 wpm silent reading, 140 wpm speech). Never presented as exact.
 */

const CJK_RANGES =
  /[\u2E80-\u2FFF\u3040-\u30FF\u3400-\u4DBF\u4E00-\u9FFF\uAC00-\uD7AF\uF900-\uFAFF\uFF66-\uFF9F]/gu

const WORD_TOKEN_RE = /[\p{L}\p{M}\p{N}]+(?:[’'-][\p{L}\p{M}\p{N}]+)*/gu

const SENTENCE_END_RE =
  /[.!?…。！？]+(?=\s|$|[\u2E80-\u2FFF\u3040-\u30FF\u3400-\u4DBF\u4E00-\u9FFF\uAC00-\uD7AF\uF900-\uFAFF\uFF66-\uFF9F])/gu

const encoder = new TextEncoder()

export interface TextStats {
  /** Unicode code point count. */
  characters: number
  /** Code points that are not whitespace. */
  charactersExcludingSpaces: number
  /** Language-appropriate segmentation (see module docs). */
  words: number
  /** CJK ideographs counted as individual words. */
  cjkWords: number
  /** Estimated sentence boundaries (see module docs). */
  sentences: number
  /** Blocks of text separated by blank lines. */
  paragraphs: number
  lines: number
  whitespace: number
  /** UTF-8 encoded size in bytes. */
  bytes: number
}

/** Documented average adult silent-reading rate (words per minute). */
export const READING_WORDS_PER_MINUTE = 220

/** Documented average speaking rate (words per minute, typical speech). */
export const SPEAKING_WORDS_PER_MINUTE = 140

export function analyzeText(text: string): TextStats {
  const cjkWords = countMatches(CJK_RANGES, text)
  const withoutCjk = text.replace(CJK_RANGES, " ")

  const words = withoutCjk.match(WORD_TOKEN_RE)?.length ?? 0

  let characters = 0
  let charactersExcludingSpaces = 0
  let whitespace = 0
  for (const codePoint of text) {
    characters += 1
    if (isWhitespace(codePoint)) {
      whitespace += 1
    } else {
      charactersExcludingSpaces += 1
    }
  }

  const sentences = countMatches(SENTENCE_END_RE, text)
  const paragraphs = text.split(/\n[ \t]*\n+/).filter((block) => /[^\s]/.test(block)).length
  const rawLines = text === "" ? [] : text.split(/\r\n|\r|\n/)
  const lines =
    rawLines.length > 0 && rawLines[rawLines.length - 1] === ""
      ? rawLines.length - 1
      : rawLines.length

  return {
    characters,
    charactersExcludingSpaces,
    words: words + cjkWords,
    cjkWords,
    sentences,
    paragraphs,
    lines,
    whitespace,
    bytes: encoder.encode(text).length,
  }
}

function isWhitespace(codePoint: string): boolean {
  return /\s/u.test(codePoint)
}

function countMatches(re: RegExp, text: string): number {
  re.lastIndex = 0
  return text.match(re)?.length ?? 0
}

/** Estimated reading duration in seconds. An estimate, clearly. */
export function readingTimeSeconds(words: number): number {
  return Math.round((words / READING_WORDS_PER_MINUTE) * 60)
}

/** Estimated speaking duration in seconds. An estimate, clearly. */
export function speakingTimeSeconds(words: number): number {
  return Math.round((words / SPEAKING_WORDS_PER_MINUTE) * 60)
}

/** "2 min 5 s" or "45 s" — a display helper for the time estimates. */
export function formatDuration(totalSeconds: number): string {
  if (totalSeconds <= 0) return "0 s"
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  if (minutes === 0) return `${seconds} s`
  if (seconds === 0) return `${minutes} min`
  return `${minutes} min ${seconds} s`
}
