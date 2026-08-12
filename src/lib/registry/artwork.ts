// Runtime registry of tool decorations (ASCII art printed at the end of
// each tool help page). Tool modules register on import via
// registerDecoration(id, art); build-help-artwork.mjs bundles everything
// once and snapshots the result to generated/help-artwork.ts.

const decorations = new Map<string, string>()

export function registerDecoration(id: string, art: string): void {
  if (decorations.has(id)) throw new Error(`decoration already registered for "${id}"`)
  decorations.set(id, art)
}

/** Collects the registered decorations (JSON-serializable). */
export function collectDecorations(): Record<string, string> {
  return Object.fromEntries(decorations)
}