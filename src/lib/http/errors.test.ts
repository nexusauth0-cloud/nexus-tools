import { describe, expect, it } from "vitest"
import { mapAbortError, mapFetchError, mapTimeoutError } from "./index"

describe("mapFetchError — distinct failure classification", () => {
  it("classifies our own timeout abort as TIMEOUT", () => {
    const mapped = mapFetchError(new DOMException("Request timed out", "TimeoutError"))
    expect(mapped.code).toBe("TIMEOUT")
    expect(mapped.message).toMatch(/timed out/i)
  })

  it("classifies user/engine aborts as ABORTED", () => {
    const mapped = mapFetchError(new DOMException("Request cancelled", "AbortError"))
    expect(mapped.code).toBe("ABORTED")
    expect(mapped.message).toMatch(/cancelled/i)
  })

  it("classifies the browser CORS failure signature as CORS", () => {
    const mapped = mapFetchError(new TypeError("Failed to fetch"))
    expect(mapped.code).toBe("CORS")
    expect(mapped.message).toMatch(/CORS/i)
  })

  it("classifies other network TypeErrors as NETWORK", () => {
    const mapped = mapFetchError(new TypeError("terminated"))
    expect(mapped.code).toBe("NETWORK")
    expect(mapped.message).toMatch(/network/i)
  })

  it("classifies anything else as UNKNOWN", () => {
    const mapped = mapFetchError(new Error("something odd"))
    expect(mapped.code).toBe("UNKNOWN")
  })

  it("keeps the shared helpers consistent", () => {
    expect(mapAbortError().code).toBe("ABORTED")
    expect(mapTimeoutError().code).toBe("TIMEOUT")
  })
})
