import type { ToolManifest } from "@/shared/manifest"
import { isPremium } from "@/shared/manifest"
import { getCategoryMeta } from "@/data/category-meta"

export type ToolSort = "relevance" | "popularity" | "newest" | "rating"

export interface ToolSearchOptions {
  query?: string
  categoryId?: string
  premiumOnly?: boolean
  featuredOnly?: boolean
  sort?: ToolSort
  limit?: number
  offset?: number
}

export interface ToolSearchResult {
  tool: ToolManifest
  score: number
}

export interface ToolSearchEngine {
  search(options: ToolSearchOptions): ToolSearchResult[]
}

interface SearchDocument {
  tool: ToolManifest
  /** Lowercased tokens used for matching. */
  tokens: string[]
  description: string
  categoryName: string
}

const MIN_TOKEN_LENGTH_FOR_FUZZY = 4

/**
 * Client-side search engine over the tool registry.
 *
 * The engine is intentionally self-contained and synchronous so it can run
 * anywhere (browser, server, tests). It can be swapped for a remote provider
 * (Meilisearch / Algolia) behind the same `ToolSearchEngine` interface
 * without touching UI code.
 */
export function createSearchEngine(tools: ToolManifest[]): ToolSearchEngine {
  const documents: SearchDocument[] = tools.map((tool) => {
    const tokens = new Set<string>()
    for (const word of tokenize(tool.title)) tokens.add(word)
    for (const word of tokenize(tool.slug)) tokens.add(word)
    for (const keyword of tool.keywords) tokens.add(normalize(keyword))
    for (const tag of tool.tags) tokens.add(normalize(tag))
    tokens.add(normalize(tool.categoryId))
    tokens.add(normalize(getCategoryMeta(tool.categoryId).name))

    return {
      tool,
      tokens: Array.from(tokens),
      description: normalize(tool.shortDescription + " " + tool.description),
      categoryName: getCategoryMeta(tool.categoryId).name,
    }
  })

  return {
    search(options) {
      const {
        query = "",
        categoryId,
        premiumOnly,
        featuredOnly,
        sort = "relevance",
        limit = 24,
        offset = 0,
      } = options

      const terms = tokenize(query)
      const scored: ToolSearchResult[] = []

      for (const doc of documents) {
        const tool = doc.tool

        if (categoryId && tool.categoryId !== categoryId) continue
        if (premiumOnly && !isPremium(tool.tier)) continue
        if (featuredOnly && !tool.featured) continue

        const score = terms.length === 0 ? 1 : scoreDocument(doc, terms)
        if (score <= 0) continue

        scored.push({ tool, score })
      }

      scored.sort(comparators[sort])

      return scored.slice(offset, offset + limit)
    },
  }
}

function scoreDocument(doc: SearchDocument, terms: string[]): number {
  let score = 0

  for (const term of terms) {
    let best = 0
    const title = normalize(doc.tool.title)

    if (title === term) best = Math.max(best, 12)
    else if (title.startsWith(term)) best = Math.max(best, 9)
    else if (title.includes(term)) best = Math.max(best, 7)

    if (doc.tokens.includes(term)) best = Math.max(best, 6)

    if (doc.categoryName === term) best = Math.max(best, 5)
    else if (doc.categoryName.startsWith(term)) best = Math.max(best, 4)

    for (const token of doc.tokens) {
      if (token.startsWith(term) && token !== term) {
        best = Math.max(best, 4)
        break
      }
      if (term.length >= MIN_TOKEN_LENGTH_FOR_FUZZY && fuzzyMatch(term, token)) {
        best = Math.max(best, 3)
      }
    }

    if (doc.description.includes(term)) best = Math.max(best, 2)

    score += best
  }

  return score
}

/**
 * True when `a` can be turned into `b` with at most one substitution,
 * insertion, or deletion. Only invoked for short typo correction.
 */
function withinEditDistance(a: string, b: string, max = 1): boolean {
  if (Math.abs(a.length - b.length) > max) return false

  const shorter = a.length <= b.length ? a : b
  const longer = a.length <= b.length ? b : a

  let previous = Array.from({ length: shorter.length + 1 }, (_, i) => i)
  let current: number[] = new Array(shorter.length + 1)

  for (let j = 1; j <= longer.length; j++) {
    current[0] = j
    for (let i = 1; i <= shorter.length; i++) {
      current[i] =
        shorter[i - 1] === longer[j - 1]
          ? previous[i - 1]
          : Math.min(previous[i - 1], previous[i], current[i - 1]) + 1
    }
    previous = current
    current = new Array(shorter.length + 1)
    if (Math.min(...previous) > max) return false
  }

  return previous[shorter.length] <= max
}

function fuzzyMatch(term: string, token: string): boolean {
  return token.length >= MIN_TOKEN_LENGTH_FOR_FUZZY && withinEditDistance(term, token)
}

type Comparator = (a: ToolSearchResult, b: ToolSearchResult) => number

const comparators: Record<ToolSort, Comparator> = {
  relevance: (a, b) => b.score - a.score || b.tool.usage - a.tool.usage,
  popularity: (a, b) => b.tool.usage - a.tool.usage,
  newest: (a, b) => b.tool.updatedAt.localeCompare(a.tool.updatedAt),
  rating: (a, b) => b.tool.rating - a.tool.rating || b.tool.usage - a.tool.usage,
}

function normalize(input: string): string {
  return input.toLowerCase().trim().replace(/\s+/g, " ")
}

function tokenize(input: string): string[] {
  return normalize(input)
    .split(/[\s\-_./:()]+/)
    .filter(Boolean)
}
