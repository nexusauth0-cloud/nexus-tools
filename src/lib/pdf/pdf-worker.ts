/**
 * One-time pdf.js worker setup for the browser.
 *
 * Import from any client component that reads PDFs and call
 * `configurePdfWorker()` from an event handler. The worker itself is
 * imported through webpack/file-loader's `?worker` asset handling, so
 * the exact version bundled in `node_modules` is used (no CDN, no
 * version drift) and parsing happens off the main thread. The guard
 * keeps worker creation out of server-side prerendering.
 */
import { GlobalWorkerOptions } from "pdfjs-dist/legacy/build/pdf.mjs"

const workerUrl = new URL("pdfjs-dist/legacy/build/pdf.worker.min.mjs", import.meta.url)
const workerType = workerUrl.toString().endsWith(".mjs") ? "module" : "classic"

let configured = false

export function configurePdfWorker(): void {
  if (typeof window === "undefined" || configured) return
  configured = true
  GlobalWorkerOptions.workerPort = new Worker(workerUrl, { type: workerType })
}
