import { z } from "zod"
import type { ToolValidationIssue, ToolValidationResult } from "./types"

/**
 * Reusable validation primitives built on Zod.
 *
 * Every validator standardizes on the same output shape
 * (`ToolValidationResult`) and the same human-readable messages, so UI
 * components can render errors identically for every tool.
 */

const DEFAULT_MIN_LENGTH = 1

export interface TextFieldOptions {
  min?: number
  max?: number
  trim?: boolean
}

/** Plain text input. */
export function textField(options: TextFieldOptions = {}): z.ZodString {
  const { min = DEFAULT_MIN_LENGTH, max, trim = true } = options
  let schema = z
    .string()
    .min(min, { message: `At least ${min} character${min === 1 ? "" : "s"} required.` })
  if (max !== undefined) {
    schema = schema.max(max, { message: `No more than ${max} characters.` })
  }
  return trim ? schema.trim() : schema
}

/** Plain text input allowing empty values. */
export function optionalTextField(options: { max?: number } = {}): z.ZodString {
  const schema = z.string().trim()
  return options.max !== undefined
    ? schema.max(options.max, { message: `No more than ${options.max} characters.` })
    : schema
}

/** Whole numbers (>= 0 unless a minimum is given). */
export function integerField(min = 0, max?: number): z.ZodNumber {
  let schema = z
    .number({ error: "Must be a number." })
    .int("Must be a whole number.")
    .min(min, { message: `Must be at least ${min}.` })
  if (max !== undefined) {
    schema = schema.max(max, { message: `Must be at most ${max}.` })
  }
  return schema
}

/** Floating-point number input. */
export function numberField(min = -Infinity, max = Infinity): z.ZodNumber {
  let schema = z.number({ error: "Must be a number." })
  if (Number.isFinite(min)) {
    schema = schema.min(min, { message: `Must be at least ${min}.` })
  }
  if (Number.isFinite(max)) {
    schema = schema.max(max, { message: `Must be at most ${max}.` })
  }
  return schema
}

/** Absolute URL (http/https). */
export function urlField(): ReturnType<typeof z.url> {
  return z.url({ message: "Enter a valid URL (with https:// or http://)." })
}

/** Parse-and-validate JSON text. The parsed value is exposed for processing. */
export function jsonField() {
  return z
    .string()
    .trim()
    .min(1, "Paste JSON to validate.")
    .transform((text, ctx) => {
      try {
        return JSON.parse(text) as unknown
      } catch (error) {
        ctx.addIssue({
          code: "custom",
          message: `Invalid JSON: ${readJsonError(error)}`,
        })
        return text as unknown
      }
    })
}

/** Options for file inputs (falls back to a plain "invalid file" message when empty). */
export interface FileFieldOptions {
  /** Files larger than this (in bytes) are rejected. */
  maxBytes?: number
}

/**
 * A file/Blob input enforced at the validation layer so processing never
 * needs to re-check bytes or size.
 */
export function fileField(options: FileFieldOptions = {}): z.ZodType<File, File> {
  const { maxBytes } = options
  return z.custom<File>(
    (value) => isFileLike(value) && (maxBytes === undefined || (value as File).size <= maxBytes),
    maxBytes === undefined
      ? "Choose or upload a file to continue."
      : `Choose or upload a file smaller than ${formatFileSize(maxBytes)}.`
  )
}

function isFileLike(value: unknown): boolean {
  if (value instanceof File) return true
  if (typeof value === "object" && value !== null) {
    const candidate = value as { name?: unknown; size?: unknown; type?: unknown }
    return (
      typeof candidate.name === "string" &&
      typeof candidate.size === "number" &&
      typeof candidate.type === "string"
    )
  }
  return false
}

function formatFileSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${Math.round(bytes / (1024 * 1024))} MB`
  if (bytes >= 1024) return `${Math.round(bytes / 1024)} KB`
  return `${bytes} bytes`
}

function readJsonError(error: unknown): string {
  if (error instanceof SyntaxError) return error.message.replace(/^JSON\.parse: /, "")
  return "could not be parsed"
}

/** Group of primitives with shared options (e.g. tags, word lists). */
export function arrayField<T>(
  itemSchema: z.ZodType<T>,
  options: { min?: number; max?: number } = {}
): z.ZodArray<z.ZodType<T>> {
  let schema = z.array(itemSchema)
  if (options.min !== undefined) {
    schema = schema.min(options.min, {
      message: `Add at least ${options.min} item${options.min === 1 ? "" : "s"}.`,
    })
  }
  if (options.max !== undefined) {
    schema = schema.max(options.max, { message: `Keep it under ${options.max} items.` })
  }
  return schema
}

/**
 * Turn a Zod issue path (["options", 0, "limit"]) into a stable dot-path
 * for a `ToolValidationIssue` field — `options[0].limit`.
 */
export function zodPathToField(path: readonly PropertyKey[]): string {
  return path.reduce<string>((field, segment) => {
    if (typeof segment === "number") return `${field}[${segment}]`
    if (typeof segment === "symbol") return `${field}[?]`
    return field === "" ? String(segment) : `${field}.${String(segment)}`
  }, "")
}

/** Map Zod `issue.*` errors into our canonical issues array. */
export function zodIssuesToIssues(
  issues: readonly { path?: PropertyKey[]; message: string }[]
): ToolValidationIssue[] {
  return issues.map((issue) => ({
    field: zodPathToField(issue.path ?? []),
    message: issue.message,
  }))
}

/** Run any Zod schema and normalize the outcome. */
export function runSchemaValidation(schema: z.ZodTypeAny, value: unknown): ToolValidationResult {
  const parsed = schema.safeParse(value)
  if (parsed.success) return { ok: true, issues: [] }
  return { ok: false, issues: zodIssuesToIssues(parsed.error.issues) }
}

/** The first issue as a plain sentence, for toast/aria-describedby. */
export function firstIssueMessage(issues: ToolValidationIssue[]): string {
  return issues[0]?.message ?? "Please review your input."
}
