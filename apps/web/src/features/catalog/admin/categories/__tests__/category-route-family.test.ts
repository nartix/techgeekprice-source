import { describe, expect, it } from "vitest";

import { catalogueCategorySystemDefinition } from "../category-system/catalogue-category-system.definition";
import { createCategoryRouteFamily } from "../category-system/category-route-family";

describe("category route family", () => {
  it("builds generic catalogue hrefs without crossing to the Product Categories alias", () => {
    const family = createCategoryRouteFamily(
      catalogueCategorySystemDefinition,
      "generic",
    );

    expect(family.list()).toBe(
      "/admin/category-systems/catalogue/categories",
    );
    expect(family.tree()).toBe(
      "/admin/category-systems/catalogue/categories/tree",
    );
    expect(family.create()).toBe(
      "/admin/category-systems/catalogue/categories/create",
    );
    expect(family.detail(42)).toBe(
      "/admin/category-systems/catalogue/categories/42",
    );
    expect(family.edit(42)).toBe(
      "/admin/category-systems/catalogue/categories/42/edit",
    );
    expect(family.children(42)).toBe(
      "/admin/category-systems/catalogue/categories?parentId=42",
    );
  });

  it("rejects invalid numeric identifiers instead of constructing an href", () => {
    const family = createCategoryRouteFamily(
      catalogueCategorySystemDefinition,
      "product-categories",
    );

    expect(() => family.detail("02")).toThrow("invalid-identifier");
    expect(() => family.edit(0)).toThrow("invalid-identifier");
  });
});
