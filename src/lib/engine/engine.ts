import { MAX_DEPTH, MAX_INPUT_CHARS, MAX_OUTPUT_CHARS } from "./caps"
import { normalizeError } from "./errors"
import { STATIC_TOOLS } from "@/lib/registry"

/**
 * A registered tool implementation. Static tools are declared in
 * data-sheets/static.yaml (see JSON5 section); dynamic tools are plain
 * page files that call factories from lib/tools directly.
 */
export interface StaticToolEntry {
  id: string
  title: string
  entryPoint: string
  run: (input: string, params: Record<string, string>) => ToolRunResult | Promise<ToolRunResult>
  /** One-time import-and-run cache for tool modules that need it. */
  load?: () => Promise<void> | void
  /** Declarative content from data-sheets/static.yaml (renderer + docs). */
  decl?: Record<string, unknown>
}

export interface ToolRunResult {
  ok: boolean
  output: string
  /** Extra result metadata rendered by the workspace (code, token, …). */
  info?: Record<string, string>
  /** Structured result blocks to render instead of plain output. */
  blocks?: Array<{ label?: string; text: string; code?: boolean }>
  /** Present when the tool hit a hard limit; uses .limitCode. */
  errorCode?: string
  /** 1-based line of the reported error, when known. */
  line?: number
  /** 1-based column of the reported error, when known. */
  column?: number
}

export interface RunToolOptions {
  input: string
  params?: Record<string, string>
  /** Current tool list; defaults to the wired static registry. */
  tools?: StaticToolEntry[]
}

export interface RunToolOutcome {
  ok: boolean
  output: string
  error?: { message: string; line?: number; column?: number }
  info?: Record<string, string>
  blocks?: ToolRunResult["blocks"]
}

/** Enforce input caps before running a tool. */
export function checkInputCaps(input: string): string | undefined {
  if (input.trim() === "") return "default/blank-input"
  if (input.length > MAX_INPUT_CHARS) return "input/too-large"
  return undefined
}

/** Enforce depth caps on the parsed JSON/preview layer (used by json tools). */
export function checkDepth(parsed: unknown, maxDepth: number = MAX_DEPTH): string | undefined {
  if (depthOf(parsed) <= maxDepth) return undefined
  return "depth/too-deep"
}

function depthOf(value: unknown): number {
  if (value === null || typeof value !== "object") return 1
  const children = Array.isArray(value) ? value : Object.values(value)
  let deepest = 1
  for (const child of children) {
    deepest = Math.max(deepest, 1 + depthOf(child))
  }
  return deepest
}

/** Run a static tool end to end: caps → run → output caps → error normalization. */
export async function runTool(
  id: string,
  options: RunToolOptions,
  tools: StaticToolEntry[] = STATIC_TOOLS,
): Promise<RunToolOutcome> {
  const tool = tools.find((entry) => entry.id === id)
  if (!tool) {
    return { ok: false, output: "", error: normalizeError("tool/not-found") }
  }
  return executeTool(tool, options)
}

/**
 * Run a tool through its per-tool dynamic loader (ToolWorkspace path).
 * Caps and error normalization behave identically to runTool.
 */
export async function runWiredTool(
  loader: () => Promise<{ run: (input: string, params: Record<string, string>) => ToolRunResult | Promise<ToolRunResult> }>,
  options: RunToolOptions,
): Promise<RunToolOutcome> {
  const capError = checkInputCaps(options.input)
  if (capError) return { ok: false, output: "", error: normalizeError(capError) }
  let result: ToolRunResult
  try {
    const runtime = await loader()
    const outcome = await runtime.run(options.input, options.params ?? {})
    result = outcome as ToolRunResult
  } catch (error) {
    return { ok: false, output: "", error: normalizeError(error) }
  }
  return finalizeResult(result)
}

async function executeTool(tool: StaticToolEntry, options: RunToolOptions): Promise<RunToolOutcome> {
  const capError = checkInputCaps(options.input)
  if (capError) return { ok: false, output: "", error: normalizeError(capError) }
  try {
    await tool.load?.()
    const result = await tool.run(options.input, options.params ?? {})
    return finalizeResult(result)
  } catch (error) {
    return { ok: false, output: "", error: normalizeError(error) }
  }
}

function finalizeResult(result: ToolRunResult): RunToolOutcome {
  if (!result.ok) {
    const errorCode = result.errorCode ?? result.output
    const normalized = normalizeError(errorCode)
    return {
      ok: false,
      output: "",
      error: { ...normalized, line: result.line, column: result.column },
    }
  }
  if (result.output.length > MAX_OUTPUT_CHARS) {
    return { ok: false, output: "", error: normalizeError("output/too-large") }
  }
  return { ok: true, output: result.output, info: result.info, blocks: result.blocks }
}