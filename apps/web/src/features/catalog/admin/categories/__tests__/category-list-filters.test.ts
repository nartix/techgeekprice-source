import { describe, expect, it } from "vitest";

import {
  assertSupportedCategoryListFilters,
  createCategoryListRequestFilters,
  validateCategoryListFilters,
} from "../category-list-filters";
import { productCategoryAliasConfig } from "./category-system.fixtures";
import { parseCategoryListingScope } from "../category-listing-scope";

describe("category-list-filters", () => {
  it("retains invalid values locally but fails request validation closed", () => {
    const filters = { q: "toolong", slug: "", active: "all" as const };
    const requestFilters = createCategoryListRequestFilters(filters, scope());

    expect(
      validateCategoryListFilters(filters, requestFilters, {
        maximumSearchLength: 3,
      }),
    ).toEqual({ valid: false, reason: "search-too-long" });
    expect(
      createCategoryListRequestFilters(filters, scope(), {
        maximumSearchLength: 3,
      }),
    ).toEqual([]);
  });
  it("serializes q, slug, active, and parent scope as flat filters", () => {
    expect(
      createCategoryListRequestFilters(
        { q: " laptop ", slug: " laptops ", active: "active" },
        scope("parentId=0"),
      ),
    ).toEqual([
      { field: "parentId", operator: "eq", value: 0 },
      { field: "q", operator: "contains", value: "laptop" },
      { field: "slug", operator: "eq", value: "laptops" },
      { field: "active", operator: "eq", value: true },
    ]);
  });

  it("omits blank q and slug values", () => {
    expect(
      createCategoryListRequestFilters(
        { q: " ", slug: "", active: "all" },
        scope(),
      ),
    ).toEqual([]);
  });

  it("builds flat Spring-compatible Product Categories filters with configured scope links", () => {
    const productListHref = productCategoryAliasConfig.listHref;

    expect(
      createCategoryListRequestFilters(
        { q: " gaming ", slug: "", active: "inactive" },
        scope("parentId=42", productListHref),
      ),
    ).toEqual([
      { field: "parentId", operator: "eq", value: 42 },
      { field: "q", operator: "contains", value: "gaming" },
      { field: "active", operator: "eq", value: false },
    ]);
    expect(
      createCategoryListRequestFilters(
        { q: "", slug: "laptops", active: "all" },
        scope("parentId=0"),
      ),
    ).toEqual([
      { field: "parentId", operator: "eq", value: 0 },
      { field: "slug", operator: "eq", value: "laptops" },
    ]);
  });

  it.each([
    ["grouped filters", { operator: "or", value: [] }],
    ["unsupported fields", { field: "name", operator: "contains", value: "a" }],
    ["unsupported operators", { field: "slug", operator: "contains", value: "a" }],
    ["object values", { field: "q", operator: "contains", value: { q: "a" } }],
    ["array values", { field: "q", operator: "contains", value: ["a"] }],
  ])("rejects %s", (_label, filter) => {
    expect(() => assertSupportedCategoryListFilters([filter])).toThrow(
      /category list filter/i,
    );
  });
});

function scope(query = "", listHref = productCategoryAliasConfig.listHref) {
  return parseCategoryListingScope(new URLSearchParams(query), listHref).scope;
}
