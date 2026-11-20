import { describe, expect, it } from "vitest";

import {
  categorySystemReadPermission,
  categorySystemWritePermission,
  createAdminCategoryApiBasePath,
  createCategoryListingConfig,
} from "../admin-category-listing.config";
import { catalogueCategorySystemDefinition } from "../category-system/catalogue-category-system.definition";

describe("admin-category-listing.config", () => {
  it("derives catalogue API paths and permissions from the system key", () => {
    expect(createAdminCategoryApiBasePath("catalogue")).toBe(
      "/api/v1/admin/category-systems/catalogue/categories",
    );
    expect(categorySystemReadPermission("catalogue")).toBe(
      "admin:catalogue-categories:read",
    );
    expect(categorySystemWritePermission("catalogue")).toBe(
      "admin:catalogue-categories:write",
    );
  });

  it("projects Product Categories from the immutable catalogue definition", () => {
    const config = createCategoryListingConfig(
      catalogueCategorySystemDefinition,
      "product-categories",
    );

    expect(config).toMatchObject({
      enabled: true,
      labelKey: "Admin.Navigation.productCategories",
      listHref: "/admin/products/categories",
      treeHref: "/admin/products/categories/tree",
      createHref: "/admin/products/categories/create",
      resource: "productCategories",
      permissionResource: "productCategories",
      sectionKey: "products",
      systemKey: "catalogue",
      apiBasePath: "/api/v1/admin/category-systems/catalogue/categories",
      translationNamespace: "Admin.ProductCategories",
    });
    expect(config.showHref(7)).toBe(
      "/admin/products/categories/7",
    );
    expect(config.editHref(7)).toBe(
      "/admin/products/categories/7/edit",
    );
    expect(config.childrenHref(7)).toBe(
      "/admin/products/categories?parentId=7",
    );
  });

  it("does not project a legacy admin categories route", () => {
    const config = createCategoryListingConfig(
      catalogueCategorySystemDefinition,
      "product-categories",
    );

    expect(JSON.stringify(config)).not.toContain(
      "/admin/categories",
    );
    expect(JSON.stringify(config)).not.toContain(
      ["/api/v1/admin", "categories"].join("/"),
    );
    expect(JSON.stringify(config)).not.toContain(
      "Admin.Navigation.categories",
    );
  });
});
