import { PNG } from "pngjs"
import { mkdirSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

/**
 * Generates the NEXUS brand mark (a gold hexagon ring on a charcoal gradient)
 * as the PWA manifest icons, apple touch icon, and favicon.
 *
 * Pure-node pixel renderer — no native image dependencies.
 */

const root = join(dirname(fileURLToPath(import.meta.url)), "..")

const COLORS = {
  top: [11, 11, 14],
  bottom: [20, 21, 26],
  gold: [232, 182, 76],
  goldDark: [214, 156, 50],
}

function lerp(a, b, t) {
  return a + (b - a) * t
}

function hexagonPoints(cx, cy, radius, rotation = 0) {
  const points = []
  for (let i = 0; i < 6; i += 1) {
    const angle = rotation + (Math.PI / 3) * i - Math.PI / 2
    points.push([cx + radius * Math.cos(angle), cy + radius * Math.sin(angle)])
  }
  return points
}

function pointInPolygon(x, y, points) {
  let inside = false
  for (let i = 0, j = points.length - 1; i < points.length; j = i, i += 1) {
    const xi = points[i][0]
    const yi = points[i][1]
    const xj = points[j][0]
    const yj = points[j][1]
    const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi
    if (intersect) inside = !inside
  }
  return inside
}

function generate({ size, maskable }) {
  const icon = new PNG({ width: size, height: size })
  const scale = maskable ? 0.62 : 0.8
  const radius = (size / 2) * scale
  const center = size / 2
  const stroke = Math.max(3, Math.round(size / 14))

  const outer = hexagonPoints(center, center, radius)
  const inner = hexagonPoints(center, center, radius - stroke)

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const idx = (size * y + x) * 4
      const t = y / size

      let r = lerp(COLORS.top[0], COLORS.bottom[0], t)
      let g = lerp(COLORS.top[1], COLORS.bottom[1], t)
      let b = lerp(COLORS.top[2], COLORS.bottom[2], t)

      if (!maskable) {
        const corner = Math.min(x, y, size - 1 - x, size - 1 - y)
        const cornerRadius = size * 0.22
        if (corner < cornerRadius) {
          const dx = Math.max(cornerRadius - x, 0)
          const dy = Math.max(cornerRadius - y, 0)
          if (dx && dy && dx * dx + dy * dy > cornerRadius * cornerRadius) {
            icon.data[idx + 3] = 0
            continue
          }
        }
      }

      const inOuter = pointInPolygon(x, y, outer)
      const inInner = pointInPolygon(x, y, inner)
      if (inOuter && !inInner) {
        const glow = Math.max(0, 1 - Math.abs(y - center) / (size / 2))
        r = lerp(COLORS.goldDark[0], COLORS.gold[0], 0.4 + glow * 0.4)
        g = lerp(COLORS.goldDark[1], COLORS.gold[1], 0.4 + glow * 0.4)
        b = lerp(COLORS.goldDark[2], COLORS.gold[2], 0.4 + glow * 0.4)
      }

      icon.data[idx] = Math.round(r)
      icon.data[idx + 1] = Math.round(g)
      icon.data[idx + 2] = Math.round(b)
      icon.data[idx + 3] = 255
    }
  }

  return PNG.sync.write(icon)
}

const targets = [
  { file: "public/icons/icon-192.png", size: 192, maskable: false },
  { file: "public/icons/icon-512.png", size: 512, maskable: false },
  { file: "public/icons/maskable-512.png", size: 512, maskable: true },
  { file: "public/icons/apple-touch-icon.png", size: 180, maskable: false },
  { file: "public/favicon.png", size: 64, maskable: false },
]

for (const target of targets) {
  const path = join(root, target.file)
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, generate(target))
  console.log(`Generated ${target.file} (${target.size}x${target.size})`)
}
