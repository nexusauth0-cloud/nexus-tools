// Wires the generated static config to tool implementations, producing
// executable StaticToolEntry objects consumed by engine.runTool and the
// static tool pages.
import { STATIC_CONFIG } from "./static.generated"
import { TOOL_IMPLEMENTATIONS } from "@/lib/tools"
import type { StaticToolEntry } from "@/lib/engine/engine"

const built = new Map<string, StaticToolEntry>()

for (const decl of STATIC_CONFIG) {
  if (decl.disabled) continue
  const implementation = TOOL_IMPLEMENTATIONS[decl.entryPoint]
  if (!implementation) {
    // Fail loudly at import time so a config/implementation mismatch is
    // never shipped silently.
    throw new Error(`registry: no implementation for entryPoint "${decl.entryPoint}" (tool "${decl.id}")`)
  }
  built.set(decl.id, {
    id: decl.id,
    title: decl.title,
    entryPoint: decl.entryPoint,
    run: implementation.run,
    decl: decl as unknown as Record<string, unknown>,
  })
}

/** All wired, executable static tools. */
export const STATIC_TOOLS: StaticToolEntry[] = [...built.values()]

export function getStaticTool(id: string): StaticToolEntry | undefined {
  return built.get(id)
}

/** Tools grouped by category, in declaration order (for nav/index pages). */
export function listStaticTools(): Array<{ category: string; tools: StaticToolEntry[] }> {
  const groups = new Map<string, StaticToolEntry[]>()
  for (const tool of STATIC_TOOLS) {
    const category = String(tool.decl?.category ?? "Other")
    const bucket = groups.get(category) ?? []
    bucket.push(tool)
    groups.set(category, bucket)
  }
  return [...groups.entries()].map(([category, tools]) => ({ category, tools }))
}