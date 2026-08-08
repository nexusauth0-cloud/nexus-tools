/**
 * Reusable clipboard utility.
 *
 * Uses the async Clipboard API when available and falls back to a hidden
 * textarea + execCommand for older browsers. Always returns a result
 * object so callers (and the UI toast) can react consistently.
 */

export interface CopyResult {
  ok: boolean
  reason?: "unsupported" | "denied" | "fallback"
}

/** True when the Clipboard API is reachable (always the preferred path). */
export function isClipboardApiSupported(): boolean {
  return typeof navigator !== "undefined" && typeof navigator.clipboard !== "undefined"
}

/** Legacy fallback that works in browsers without the Clipboard API. */
export function legacyCopyText(text: string): boolean {
  if (typeof document === "undefined") return false
  const textarea = document.createElement("textarea")
  textarea.value = text
  textarea.setAttribute("readonly", "")
  textarea.style.position = "fixed"
  textarea.style.opacity = "0"
  textarea.style.pointerEvents = "none"
  document.body.appendChild(textarea)
  textarea.select()
  try {
    return document.execCommand("copy")
  } catch {
    return false
  } finally {
    document.body.removeChild(textarea)
  }
}

/** Copy text and report the outcome. Never throws. */
export async function copyText(text: string): Promise<CopyResult> {
  if (!isClipboardApiSupported()) {
    const copied = legacyCopyText(text)
    return copied ? { ok: true } : { ok: false, reason: "unsupported" }
  }

  try {
    await navigator.clipboard.writeText(text)
    return { ok: true }
  } catch {
    const copied = legacyCopyText(text)
    return copied ? { ok: true } : { ok: false, reason: "denied" }
  }
}

/** Short affirmative/negative copy for status UIs. */
export function copyStatusMessage(result: CopyResult): string {
  return result.ok
    ? "Copied to clipboard."
    : "Could not copy — your browser blocked clipboard access."
}
