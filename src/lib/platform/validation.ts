import type { ToolManifest } from "@/shared/manifest"
import { toolManifestSchema } from "@/shared/manifest"
import { isKnownCategory } from "@/data/category-meta"

export interface ManifestValidationResult {
  ok: boolean
  errors: string[]
}

/**
 * Validates a single manifest and every category reference it makes.
 * `validateRegistry` calls this for all registered tools so problems fail
 * fast at dev, build, and test time instead of silently at runtime.
 */
export function validateManifest(manifest: ToolManifest): ManifestValidationResult {
  const parsed = toolManifestSchema.safeParse(manifest)
  if (!parsed.success) {
    return {
      ok: false,
      errors: parsed.error.issues.map(
        (issue) => `${manifest.slug}: ${issue.path.join(".")} ${issue.message}`
      ),
    }
  }

  const errors: string[] = []

  if (!isKnownCategory(manifest.categoryId)) {
    errors.push(`${manifest.slug}: unknown categoryId "${manifest.categoryId}"`)
  }

  return { ok: errors.length === 0, errors }
}

export function validateRegistry(manifests: ToolManifest[]): ManifestValidationResult {
  const errors: string[] = []
  const slugs = new Map<string, string>()

  for (const manifest of manifests) {
    const result = validateManifest(manifest)
    errors.push(...result.errors)

    const existing = slugs.get(manifest.slug)
    if (existing !== undefined) {
      errors.push(`${manifest.slug}: duplicate manifest slug (also declared as "${existing}")`)
    } else {
      slugs.set(manifest.slug, manifest.title)
    }
  }

  for (const manifest of manifests) {
    for (const slug of manifest.related ?? []) {
      if (!slugs.has(slug)) {
        errors.push(`${manifest.slug}: related tool "${slug}" is not registered`)
      }
    }
  }

  return { ok: errors.length === 0, errors }
}

/** Throws when any registered manifest is invalid. Call in dev + build entrypoints. */
export function assertValidRegistry(manifests: ToolManifest[]): void {
  const result = validateRegistry(manifests)
  if (!result.ok) {
    throw new Error(
      `[tool-registry] ${result.errors.length} validation error(s):\n - ${result.errors.join(
        "\n - "
      )}`
    )
  }
}
