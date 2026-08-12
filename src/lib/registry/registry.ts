// =====================================================================
// Static tool definitions registry.
//
// Static tools are declared in data-sheets/static.yaml (JSON5) and
// validated by validateStaticConfig. Tools whose logic lives in
// lib/tools/*.ts are wired here by entryPoint; registry.build() binds
// the factory to each entry so lib/engine/runTool can execute them.
//
// Dynamic tools are ordinary page files (see /t/<slug>/page.ts) that
// call factories from lib/tools directly — they are NOT part of the
// static registry and render their own workspace.
// =====================================================================

export interface ToolParam {
  key: string
  label: string
  placeholder?: string
  defaultValue?: string
  options?: Array<{ value: string; label?: string }>
  helpText?: string
}

export interface ToolExample {
  label: string
  input: string
  params?: Record<string, string>
}

export interface ToolPreset {
  label: string
  input?: string
  params?: Record<string, string>
}

export interface ToolSection {
  text: string
  code?: string
}

export interface StaticToolDecl {
  id: string
  title: string
  subtitle?: string
  category: string
  icon: string
  accent: string
  entryPoint: string
  description: string[]
  examples: ToolExample[]
  hint?: string
  defaultInput?: string
  params?: ToolParam[]
  presets?: ToolPreset[]
  emptyInputPlaceholder?: string
  loops?: ToolSection[]
  faq: Array<{ q: string; a: string[] }>
  limits?: string[]
  disabled?: boolean
}

export interface StaticConfig {
  tools: StaticToolDecl[]
}

/** Validate a parsed static config. Returns a list of problems (empty = ok). */
export function validateStaticConfig(config: unknown): string[] {
  const problems: string[] = []
  if (typeof config !== "object" || config === null || Array.isArray(config)) {
    return ["static config must be an object"]
  }
  const tools = (config as { tools?: unknown }).tools
  if (!Array.isArray(tools) || tools.length === 0) {
    problems.push("tools must be a non-empty array")
    return problems
  }
  const seen = new Set<string>()
  for (const [index, tool] of tools.entries()) {
    const at = `tools[${index}]`
    if (typeof tool !== "object" || tool === null) {
      problems.push(`${at} must be an object`)
      continue
    }
    const t = tool as StaticToolDecl
    if (typeof t.id !== "string" || !/^[a-z0-9-]+$/.test(t.id)) {
      problems.push(`${at}.id must be a lowercase slug (a-z0-9-)`)
    } else if (seen.has(t.id)) {
      problems.push(`${at}.id duplicates "${t.id}"`)
    } else {
      seen.add(t.id)
    }
    if (typeof t.title !== "string" || t.title.trim() === "") {
      problems.push(`${at}.title is required`)
    }
    if (typeof t.category !== "string" || t.category.trim() === "") {
      problems.push(`${at}.category is required`)
    }
    if (typeof t.entryPoint !== "string" || t.entryPoint.trim() === "") {
      problems.push(`${at}.entryPoint is required`)
    }
    if (typeof t.accent !== "string" || !/^#[0-9a-fA-F]{6}$/.test(t.accent)) {
      problems.push(`${at}.accent must be a hex color (#rrggbb)`)
    }
    if (!Array.isArray(t.description) || t.description.some((d) => typeof d !== "string")) {
      problems.push(`${at}.description must be an array of strings`)
    }
    if (!Array.isArray(t.faq) || t.faq.some((f) => typeof f?.q !== "string" || !Array.isArray(f.a))) {
      problems.push(`${at}.faq must be an array of {q, a[]}`)
    }
    if (t.params !== undefined) {
      if (!Array.isArray(t.params)) problems.push(`${at}.params must be an array`)
      else {
        const keys = new Set<string>()
        for (const [pi, param] of t.params.entries()) {
          if (typeof param?.key !== "string" || param.key.trim() === "") {
            problems.push(`${at}.params[${pi}].key is required`)
          } else if (keys.has(param.key)) {
            problems.push(`${at}.params[${pi}].key duplicates "${param.key}"`)
          } else {
            keys.add(param.key)
          }
        }
      }
    }
    if (t.examples !== undefined && (!Array.isArray(t.examples) || t.examples.some((e) => typeof e?.label !== "string"))) {
      problems.push(`${at}.examples must be an array of {label, input}`)
    }
  }
  return problems
}