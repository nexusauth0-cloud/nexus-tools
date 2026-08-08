import type { ToolManifest } from "@/shared/manifest"

/**
 * Related-tool computation.
 *
 * Scores every candidate by shared category, shared tags, and shared
 * keywords, with popularity as a tiebreaker. When a manifest declares an
 * explicit `related` list, it is honored first (missing slugs are skipped).
 */

export interface RelatedOptions {
  limit?: number
}

export function computeRelatedTools(
  tools: ToolManifest[],
  slug: string,
  options: RelatedOptions = {}
): ToolManifest[] {
  const { limit = 3 } = options
  const source = tools.find((tool) => tool.slug === slug)
  if (!source) return []

  const bySlug = new Map(tools.map((tool) => [tool.slug, tool]))

  const explicit: ToolManifest[] = []
  const explicitSlugs = new Set<string>()
  for (const relatedSlug of source.related ?? []) {
    const tool = bySlug.get(relatedSlug)
    if (tool && tool.slug !== slug && !explicitSlugs.has(tool.slug)) {
      explicit.push(tool)
      explicitSlugs.add(tool.slug)
    }
  }

  const sourceTags = new Set(source.tags)
  const sourceKeywords = new Set(source.keywords.map(normalize))

  const scored = tools
    .filter((tool) => tool.slug !== slug && !explicitSlugs.has(tool.slug))
    .map((tool) => {
      let score = 0

      if (tool.categoryId === source.categoryId) score += 4

      for (const tag of tool.tags) {
        if (sourceTags.has(tag)) score += 3
      }

      const toolKeywords = new Set(tool.keywords.map(normalize))
      for (const keyword of toolKeywords) {
        if (sourceKeywords.has(keyword)) score += 1
      }

      return { tool, score }
    })
    .filter(({ score }) => score > 0)
    .sort(
      (a, b) => b.score - a.score || b.tool.usage - a.tool.usage || b.tool.rating - a.tool.rating
    )
    .map(({ tool }) => tool)

  return [...explicit, ...scored].slice(0, limit)
}

function normalize(input: string): string {
  return input.toLowerCase().trim()
}
