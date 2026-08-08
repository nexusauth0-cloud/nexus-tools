/**
 * Analytics facade. The default handler is a no-op, so tracking costs
 * nothing until a real provider (Plausible, PostHog, GA4…) registers via
 * `setAnalyticsHandler`. All UI tracks through these helpers — never a
 * provider SDK directly.
 */

export interface ToolViewEvent {
  slug: string
  title: string
}

export interface ToolFavoriteEvent {
  slug: string
  action: "add" | "remove"
}

export interface ToolSearchEvent {
  query: string
  results: number
}

export interface CategoryViewEvent {
  categoryId: string
}

export interface ToolRunEvent {
  slug: string
  ok: boolean
  validationMs: number
  processingMs: number
}

export interface AnalyticsEventMap {
  tool_view: ToolViewEvent
  tool_favorite: ToolFavoriteEvent
  tool_search: ToolSearchEvent
  category_view: CategoryViewEvent
  tool_run: ToolRunEvent
}

export type AnalyticsEventName = keyof AnalyticsEventMap

export interface AnalyticsHandler {
  track: <Name extends AnalyticsEventName>(event: Name, props: AnalyticsEventMap[Name]) => void
}

const noopHandler: AnalyticsHandler = {
  track: () => {},
}

let handler: AnalyticsHandler = noopHandler

export function setAnalyticsHandler(next: AnalyticsHandler): void {
  handler = next
}

export function track<Name extends AnalyticsEventName>(
  event: Name,
  props: AnalyticsEventMap[Name]
): void {
  handler.track(event, props)
}

export function trackToolView(props: ToolViewEvent): void {
  track("tool_view", props)
}

export function trackFavoriteToggle(props: ToolFavoriteEvent): void {
  track("tool_favorite", props)
}

export function trackToolSearch(props: ToolSearchEvent): void {
  track("tool_search", props)
}

export function trackCategoryView(props: { categoryId: string }): void {
  track("category_view", props)
}

export function trackToolRun(props: ToolRunEvent): void {
  track("tool_run", props)
}
