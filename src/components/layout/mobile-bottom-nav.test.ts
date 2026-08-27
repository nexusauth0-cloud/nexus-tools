import { describe, expect, it } from "vitest"
import { isMobileTabActive, mobileBottomTabs } from "./mobile-bottom-nav"

describe("mobile bottom navigation", () => {
  it("exposes the Home and Tools destinations with their real routes", () => {
    const hrefs = mobileBottomTabs.map((tab) => tab.href)
    expect(hrefs).toContain("/")
    expect(hrefs).toContain("/tools")
  })

  it("provides accessible labels for every tab", () => {
    for (const tab of mobileBottomTabs) {
      expect(tab.label).toBeTruthy()
      expect(typeof tab.label).toBe("string")
    }
  })

  it("marks Home active only on the exact root path", () => {
    const home = mobileBottomTabs.find((t) => t.href === "/")
    expect(home).toBeDefined()
    expect(isMobileTabActive(home!, "/")).toBe(true)
    expect(isMobileTabActive(home!, "/tools")).toBe(false)
    expect(isMobileTabActive(home!, "/tools/json-formatter")).toBe(false)
  })

  it("marks Tools active on the catalog and any tool route", () => {
    const tools = mobileBottomTabs.find((t) => t.href === "/tools")
    expect(tools).toBeDefined()
    expect(isMobileTabActive(tools!, "/tools")).toBe(true)
    expect(isMobileTabActive(tools!, "/tools/json-formatter")).toBe(true)
    expect(isMobileTabActive(tools!, "/categories/image")).toBe(false)
    expect(isMobileTabActive(tools!, "/")).toBe(false)
  })

  it("never marks both Home and Tools active on the same path", () => {
    const cases = ["/", "/tools", "/tools/hash-generator", "/pricing", "/blog"]
    for (const path of cases) {
      const activeCount = mobileBottomTabs.filter((tab) => isMobileTabActive(tab, path)).length
      expect(activeCount, `path "${path}"`).toBeLessThanOrEqual(1)
    }
  })

  it("leaves every tab inactive on unrelated routes", () => {
    for (const path of ["/pricing", "/blog", "/privacy"]) {
      expect(mobileBottomTabs.some((tab) => isMobileTabActive(tab, path))).toBe(false)
    }
  })
})
