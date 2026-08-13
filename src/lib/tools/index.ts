// Barrel over every tool module. Importing this file registers all
// decorations (artwork) and exposes implementations for registry wiring.
import * as jsonTool from "@/features/tools/json/tool"
import * as yamlTool from "@/features/tools/yaml/tool"
import * as csvTool from "@/features/tools/csv/tool"
import * as colorTool from "@/features/tools/color/tool"
import * as radixTool from "@/features/tools/radix/tool"
import type { ToolRunResult } from "@/lib/engine/engine"

export interface ToolModule {
  run: (input: string, params: Record<string, string>) => ToolRunResult | Promise<ToolRunResult>
  helpArt?: string
}

/** Map of static-tool entryPoint ids to their implementing modules. */
export const TOOL_IMPLEMENTATIONS: Record<string, ToolModule> = {
  "tools:json": jsonTool as unknown as ToolModule,
  "tools:yaml": yamlTool as unknown as ToolModule,
  "tools:csv": csvTool as unknown as ToolModule,
  "tools:color": colorTool as unknown as ToolModule,
  "tools:radix": radixTool as unknown as ToolModule,
}

export interface RuntimeModule {
  run: (input: string, params: Record<string, string>) => ToolRunResult | Promise<ToolRunResult>
}

/**
 * Per-tool dynamic loaders used by the ToolWorkspace, so each static tool
 * page bundles only its own logic module (and its data deps), never the
 * whole registry.
 */
const RUNTIME_LOADERS: Record<string, () => Promise<RuntimeModule>> = {
  "tools:json": () => import("@/features/tools/json/tool"),
  "tools:yaml": () => import("@/features/tools/yaml/tool"),
  "tools:csv": () => import("@/features/tools/csv/tool"),
  "tools:color": () => import("@/features/tools/color/tool"),
  "tools:radix": () => import("@/features/tools/radix/tool"),
}

export function getRuntimeLoader(entryPoint: string): (() => Promise<RuntimeModule>) | undefined {
  return RUNTIME_LOADERS[entryPoint]
}

export { jsonTool, yamlTool, csvTool, colorTool, radixTool }
