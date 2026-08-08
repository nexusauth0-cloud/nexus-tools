import { describe, expect, it } from "vitest"
import { buildBreadcrumbItems, categoryBreadcrumbItems } from "../breadcrumbs"
import { makeTool } from "./fixtures"

describe("breadcrumbs", () => {
  it("builds Home > Category > Tool for a tool", () => {
    const items = buildBreadcrumbItems(
      makeTool({ slug: "json-formatter", categoryId: "developer" })
    )
    expect(items).toEqual([
      { label: "Home", path: "/" },
      { label: "Developer Tools", path: "/categories/developer" },
      { label: "Json Formatter", path: "/tools/json-formatter" },
    ])
  })

  it("builds Home > Category for a category", () => {
    expect(categoryBreadcrumbItems("image")).toEqual([
      { label: "Home", path: "/" },
      { label: "Categories", path: "/categories" },
      { label: "Image Tools", path: "/categories/image" },
    ])
  })
})
