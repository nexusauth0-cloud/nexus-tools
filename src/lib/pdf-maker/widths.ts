/**
 * Helvetica glyph widths (Adobe core font metric data, public spec).
 *
 * The base-14 Helvetica AFM width table is part of the public Adobe
 * Font Metrics specification. Widths are in 1/1000 text space units and
 * are used to wrap text line-by-line without layout feedback from the
 * PDF viewer. Characters on the extended WinAnsi range (most accented
 * Latin-1 letters) use the common average width of 556/1000 em.
 */

/** Width (1/1000 em) of the printable ASCII + a few WinAnsi characters. */
const ASCII_ROW: Record<string, number> = {
  " ": 278,
  "!": 278,
  '"': 355,
  "#": 556,
  $: 556,
  "%": 889,
  "&": 667,
  "'": 191,
  "(": 333,
  ")": 333,
  "*": 389,
  "+": 584,
  ",": 278,
  "-": 333,
  ".": 278,
  "/": 278,
  "0": 556,
  "1": 556,
  "2": 556,
  "3": 556,
  "4": 556,
  "5": 556,
  "6": 556,
  "7": 556,
  "8": 556,
  "9": 556,
  ":": 278,
  ";": 278,
  "<": 584,
  "=": 584,
  ">": 584,
  "?": 556,
  "@": 1015,
  A: 667,
  B: 667,
  C: 722,
  D: 722,
  E: 667,
  F: 611,
  G: 778,
  H: 722,
  I: 278,
  J: 500,
  K: 667,
  L: 556,
  M: 833,
  N: 722,
  O: 778,
  P: 667,
  Q: 778,
  R: 722,
  S: 667,
  T: 611,
  U: 722,
  V: 667,
  W: 944,
  X: 667,
  Y: 667,
  Z: 611,
  "[": 278,
  "\\": 278,
  "]": 278,
  "^": 469,
  _: 556,
  "`": 333,
  a: 556,
  b: 556,
  c: 500,
  d: 556,
  e: 556,
  f: 278,
  g: 556,
  h: 556,
  i: 222,
  j: 222,
  k: 500,
  l: 222,
  m: 833,
  n: 556,
  o: 556,
  p: 556,
  q: 556,
  r: 333,
  s: 500,
  t: 278,
  u: 556,
  v: 500,
  w: 722,
  x: 500,
  y: 500,
  z: 500,
  "{": 334,
  "|": 260,
  "}": 334,
  "~": 584,
}

/**
 * Width (1/1000 em) of a character in the WinAnsi repertoire.
 * Accepts a WinAnsi code point (Unicode scalar) — extended Latin-1
 * characters average 556/1000; anything unrepresentable is 0.
 */
export function winAnsiWidth(codePoint: number): number {
  if (codePoint <= 0x7e) return ASCII_ROW[String.fromCharCode(codePoint)] ?? 0
  if ((codePoint >= 0xa0 && codePoint <= 0xff) || codePoint === 0x20ac) return 556
  return 0
}

/** Total rendered width in points for a WinAnsi-encoded string. */
export function measureWinAnsiLine(text: string, fontSize: number): number {
  const scale = fontSize / 1000
  let total = 0
  for (const char of text) total += winAnsiWidth(char.codePointAt(0) ?? 0x20) * scale
  return total
}
