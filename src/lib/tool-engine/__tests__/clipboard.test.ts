import { describe, expect, it } from "vitest"
import { copyStatusMessage, copyText, isClipboardApiSupported, legacyCopyText } from "../clipboard"

describe("clipboard", () => {
  it("reports the API as unsupported in non-browser environments", () => {
    expect(isClipboardApiSupported()).toBe(false)
  })

  it("legacy copy never crashes without a document", () => {
    expect(legacyCopyText("x")).toBe(false)
  })

  it("copyText falls back gracefully without the Clipboard API", async () => {
    const result = await copyText("hello")
    expect(result.ok).toBe(false)
    expect(result.reason).toBe("unsupported")
  })

  it("copyStatusMessage reflects the outcome", () => {
    expect(copyStatusMessage({ ok: true })).toContain("Copied")
    expect(copyStatusMessage({ ok: false, reason: "denied" })).toContain("blocked")
  })
})
