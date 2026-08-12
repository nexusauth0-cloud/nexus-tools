export interface ChangelogEntry {
  version: string
  date: string
  summary: string
  changes: string[]
}

/** Changelog entries for the /changelog page. Hand-maintained, newest on top. */
export const changelog: ChangelogEntry[] = [
  {
    version: "0.2.0",
    date: "2026-08-11",
    summary: "Data converters arrive: YAML ↔ JSON, CSV → JSON, color, and number base tools.",
    changes: [
      "New /t/ workspace with in-browser processing, file open, ⌘/Ctrl+Enter, and preset quick starts.",
      "YAML parsing hardened: plain-data only, alias-bomb and depth caps, safe error context.",
      "CSV parsed strictly (RFC 4180) with quoted fields and row-width validation.",
      "Color converter covers hex / rgb() / hsl() plus named colors.",
      "Number base converter reads any base 2–36 with a deterministic parse rule.",
      "Static tool definitions moved to data-sheets/static.yaml (JSON5) with build-time validation.",
    ],
  },
  {
    version: "0.1.0",
    date: "2026-08-01",
    summary: "Initial release of NEXUS Tools.",
    changes: ["Launch of the tool suite with image, text, developer, and productivity tools."],
  },
]