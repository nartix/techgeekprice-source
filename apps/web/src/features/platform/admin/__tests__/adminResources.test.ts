import { describe, expect, it } from "vitest";

import {
  adminResources,
  getAdminResourceMetadata,
} from "../resources/adminResources";

describe("adminResources", () => {
  it("registers Product Categories with strict catalogue metadata", () => {
    expect(getAdminResourceMetadata("productCategories")).toMatchObject({
      name: "productCategories",
      groupKey: "products",
      list: "/admin/products/categories",
      create: "/admin/products/categories/create",
      show: "/admin/products/categories/:id",
      edit: "/admin/products/categories/:id/edit",
      apiPath: "/api/v1/admin/category-systems/catalogue/categories",
      labelKey: "Admin.Navigation.productCategories",
      strictPermissions: true,
      permissions: {
        list: "admin:catalogue-categories:read",
        show: "admin:catalogue-categories:read",
        create: "admin:catalogue-categories:write",
        edit: "admin:catalogue-categories:write",
        delete: "admin:catalogue-categories:write",
        move: "admin:catalogue-categories:write",
        state: "admin:catalogue-categories:write",
      },
      capabilities: { optionalActions: [] },
    });
  });

  it("does not register the legacy categories resource", () => {
    expect(adminResources.map((resource) => resource.name)).toEqual([
      "productCategories",
      "users",
    ]);
    expect(() => getAdminResourceMetadata("categories" as never)).toThrow(
      "Unknown admin resource: categories",
    );
  });

  it("does not expose deferred category systems", () => {
    expect(adminResources.map((resource) => resource.name)).not.toContain(
      "blogCategories",
    );
    expect(adminResources.map((resource) => resource.name)).not.toContain(
      "galleryCategories",
    );
  });
});
