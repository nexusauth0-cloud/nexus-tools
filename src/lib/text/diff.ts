/**
 * Line diff — deterministic Myers O(ND) implementation.
 *
 * The classic "An O(ND) Difference Algorithm" (Myers, 1986) is used:
 * worst-case O((N+M)·D) time where N/M are the line counts and D the
 * number of edits. Identical texts short-circuit in O(N). Changed lines
 * are pairs of remove+insert at the same edit position, reported as
 * "modified" — pure adds and removes stay distinct.
 *
 * Input is bounded by the tool (max chars + max lines per side);
 * diffing is done on plain text only — never parsed, never executed.
 */

export type DiffOpType = "equal" | "insert" | "delete"

export interface DiffOp {
  type: DiffOpType
  line: string
}

export interface DiffResult {
  ops: DiffOp[]
  /** Lines only in the modified side. */
  added: number
  /** Lines only in the original side. */
  removed: number
  /** Lines present in both sides. */
  unchanged: number
  /** Blocks containing both removes and inserts (counts of blocks). */
  modifiedBlocks: number
  /** Total changed lines (added + removed). */
  changed: number
}

/** Split text into lines (dropping line endings, matching display). */
export function splitLines(text: string): string[] {
  const normalized = text.replace(/\r\n|\r/g, "\n")
  if (normalized === "") return []
  const lines = normalized.split("\n")
  return lines.length > 0 && lines[lines.length - 1] === "" ? lines.slice(0, -1) : lines
}

export function diffLines(original: string, modified: string): DiffResult {
  const a = splitLines(original)
  const b = splitLines(modified)

  let ops: DiffOp[]
  if (a.length === 0 && b.length === 0) {
    ops = []
  } else if (a.length === 0) {
    ops = b.map((line) => ({ type: "insert" as const, line }))
  } else if (b.length === 0) {
    ops = a.map((line) => ({ type: "delete" as const, line }))
  } else if (arraysEqual(a, b)) {
    ops = a.map((line) => ({ type: "equal" as const, line }))
  } else {
    ops = myersOps(a, b)
  }

  return summarize(ops)
}

function summarize(ops: DiffOp[]): DiffResult {
  let added = 0
  let removed = 0
  let unchanged = 0
  let modifiedBlocks = 0
  let blockHasAdd = false
  let blockHasRemove = false

  for (const op of ops) {
    if (op.type === "insert") {
      added += 1
      blockHasAdd = true
    } else if (op.type === "delete") {
      removed += 1
      blockHasRemove = true
    } else {
      unchanged += 1
      if (blockHasAdd && blockHasRemove) modifiedBlocks += 1
      blockHasAdd = false
      blockHasRemove = false
    }
  }
  if (blockHasAdd && blockHasRemove) modifiedBlocks += 1

  return { ops, added, removed, unchanged, modifiedBlocks, changed: added + removed }
}

function arraysEqual(a: readonly string[], b: readonly string[]): boolean {
  if (a.length !== b.length) return false
  for (let index = 0; index < a.length; index += 1) {
    if (a[index] !== b[index]) return false
  }
  return true
}

/** Myers edit script over lines. Deterministic; biased to deletions first. */
function myersOps(a: readonly string[], b: readonly string[]): DiffOp[] {
  const n = a.length
  const m = b.length
  const max = n + m
  const offset = max
  const v = new Int32Array(2 * max + 1)
  const trace: Int32Array[] = []
  const foundD = (() => {
    for (let d = 0; d <= max; d += 1) {
      const snapshot = new Int32Array(v)
      trace.push(snapshot)
      for (let k = -d; k <= d; k += 2) {
        let x
        if (k === -d || (k !== d && v[k - 1 + offset] < v[k + 1 + offset])) {
          x = v[k + 1 + offset]
        } else {
          x = v[k - 1 + offset] + 1
        }
        let y = x - k
        while (x < n && y < m && a[x] === b[y]) {
          x += 1
          y += 1
        }
        v[k + offset] = x
        if (x >= n && y >= m) return d
      }
    }
    return max
  })()

  return backtrack(a, b, v, trace, foundD)
}

function backtrack(
  a: readonly string[],
  b: readonly string[],
  lastV: Int32Array,
  trace: readonly Int32Array[],
  d: number
): DiffOp[] {
  const ops: DiffOp[] = []
  const offset = a.length + b.length
  let x = a.length
  let y = b.length

  for (let step = d; step > 0; step -= 1) {
    const vPrev = trace[step]
    const k = x - y
    let prevK
    if (k === -step || (k !== step && vPrev[k - 1 + offset] < vPrev[k + 1 + offset])) {
      prevK = k + 1
    } else {
      prevK = k - 1
    }
    const prevX = vPrev[prevK + offset]
    const prevY = prevX - prevK

    while (x > prevX && y > prevY) {
      x -= 1
      y -= 1
      ops.push({ type: "equal", line: a[x] })
    }
    if (x === prevX) {
      y -= 1
      ops.push({ type: "insert", line: b[y] })
    } else {
      x -= 1
      ops.push({ type: "delete", line: a[x] })
    }
  }

  while (x > 0 && y > 0) {
    x -= 1
    y -= 1
    ops.push({ type: "equal", line: a[x] })
  }
  while (x > 0) {
    x -= 1
    ops.push({ type: "delete", line: a[x] })
  }
  while (y > 0) {
    y -= 1
    ops.push({ type: "insert", line: b[y] })
  }

  return ops.reverse()
}
