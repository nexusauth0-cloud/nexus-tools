/**
 * Fetch error mapping — turn browser fetch failures into honest,
 * user-friendly messages. Never stack traces.
 */

export interface FetchErrorInfo {
  /** Stable machine code for tests + UI mapping. */
  code: "TIMEOUT" | "ABORTED" | "NETWORK" | "CORS" | "UNKNOWN"
  message: string
}

/** Identify a CORS failure from a TypeError message (the only signal browsers give). */
export function isLikelyCorsError(error: unknown): boolean {
  if (!(error instanceof TypeError)) return false
  return /failed to fetch/i.test(error.message)
}

/** Map an aborted fetch (AbortController) to a friendly result. */
export function mapAbortError(): FetchErrorInfo {
  return { code: "ABORTED", message: "The request was cancelled." }
}

/** Map a fetch aborted by our own timeout (abort reason named TimeoutError). */
export function mapTimeoutError(): FetchErrorInfo {
  return {
    code: "TIMEOUT",
    message:
      "The request timed out before the server responded. Increase the timeout and try again.",
  }
}

/** Map any thrown fetch error to a friendly, classified message. */
export function mapFetchError(error: unknown): FetchErrorInfo {
  if (error instanceof DOMException && error.name === "TimeoutError") return mapTimeoutError()

  if (error instanceof DOMException && error.name === "AbortError") return mapAbortError()

  if (isLikelyCorsError(error)) {
    return {
      code: "CORS",
      message:
        "CORS prevented the browser from reading the response. The destination server must allow browser requests (Access-Control-Allow-Origin).",
    }
  }

  if (error instanceof TypeError) {
    return {
      code: "NETWORK",
      message:
        "The request failed at the network level. Check the URL, your connection, and that the server is reachable from your browser.",
    }
  }

  return {
    code: "UNKNOWN",
    message: "The request failed for an unexpected reason. Try again or check the URL.",
  }
}
