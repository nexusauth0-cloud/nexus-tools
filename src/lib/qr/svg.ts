import type { QrGeneratedMatrix } from "./types"

/**
 * Pure SVG renderer for a QR matrix. Produces a standalone SVG string with
 * an embedded dark-module path — no DOM, no canvas, usable in node and the
 * browser alike (download/copy handled by the caller).
 */

export interface SvgRenderOptions {
  foreground: string
  background: string
  /** Final rendered edge length in pixels (viewBox stays in module units). */
  size: number
}

/** Render a QR matrix as an SVG string. */
export function renderQrSvg(matrix: QrGeneratedMatrix, options: SvgRenderOptions): string {
  const { modules, size } = matrix
  const { foreground, background } = options

  // One <path> per module would blow up the file; group runs of dark
  // modules per row into horizontal segments instead.
  const segments: Array<[number, number, number, number]> = []
  for (let row = 0; row < size; row++) {
    let col = 0
    while (col < size) {
      if (modules[row * size + col]) {
        let runEnd = col
        while (runEnd < size && modules[row * size + runEnd]) runEnd++
        segments.push([col, row, runEnd - col, 1])
        col = runEnd
      } else {
        col++
      }
    }
  }

  const path = segments.map(([x, y, w, h]) => `M${x} ${y}h${w}v${h}h-${w}z`).join("")

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${options.size}" height="${options.size}" viewBox="0 0 ${size} ${size}" shape-rendering="crispEdges" role="img" aria-label="QR code">`,
    `<rect width="100%" height="100%" fill="${background}"/>`,
    `<path d="${path}" fill="${foreground}"/>`,
    `</svg>`,
  ].join("")
}
