import { describe, expect, it } from "vitest";

import { catalogueCategorySystemDefinition } from "../category-system/catalogue-category-system.definition";
import {
  createCategorySystemRegistry,
  categorySystemRegistry,
} from "../category-system/category-system.registry";
import { createRestrictedCategorySystemDefinition } from "./category-system.fixtures";

describe("category system registry", () => {
  it("contains exactly the immutable catalogue definition by both identities", () => {
    expect(categorySystemRegistry.list()).toEqual([
      catalogueCategorySystemDefinition,
    ]);
    expect(categorySystemRegistry.getBySystemKey("catalogue")).toBe(
      catalogueCategorySystemDefinition,
    );
    expect(categorySystemRegistry.getByResource("productCategories")).toBe(
      catalogueCategorySystemDefinition,
    );
    expect(Object.isFrozen(catalogueCategorySystemDefinition)).toBe(true);
    expect(catalogueCategorySystemDefinition.declaredOperations).toHaveLength(
      14,
    );
    expect(catalogueCategorySystemDefinition.visibleOperations).toHaveLength(
      13,
    );
    expect(catalogueCategorySystemDefinition.visibleOperations).not.toContain(
      "reorder",
    );
    expect(categorySystemRegistry.projectResources()).toEqual([
      {
        resource: "productCategories",
        routeFamily: "product-categories",
        apiBasePath: "/api/v1/admin/category-systems/catalogue/categories",
        group: "products",
        icon: "productCategories",
        labelKey: "Admin.Navigation.productCategories",
        strictPermissions: true,
        operationPermissions:
          catalogueCategorySystemDefinition.operationPermissions,
      },
    ]);
    expect(categorySystemRegistry.projectNavigation()).toEqual([
      {
        resource: "productCategories",
        routeFamily: "product-categories",
        listPath: "/admin/products/categories",
        group: "products",
        icon: "productCategories",
        labelKey: "Admin.Navigation.productCategories",
        listPermission: "admin:catalogue-categories:read",
      },
    ]);
  });

  it("rejects invalid registration paths and incomplete permissions", () => {
    expect(() =>
      createCategorySystemRegistry([
        {
          ...catalogueCategorySystemDefinition,
          apiBasePath: `/api/v1/admin/${"categories"}` as never,
        },
      ]),
    ).toThrow();
    expect(() =>
      createCategorySystemRegistry([
        {
          ...catalogueCategorySystemDefinition,
          operationPermissions: {
            ...catalogueCategorySystemDefinition.operationPermissions,
            list: "",
          },
        },
      ]),
    ).toThrow();
  });

  it("rejects a colliding generic route family before returning a registry", () => {
    expect(() =>
      createCategorySystemRegistry([
        catalogueCategorySystemDefinition,
        {
          ...catalogueCategorySystemDefinition,
          systemKey: "flat-restricted",
          resource: "flatRestrictedCategories",
          apiBasePath:
            "/api/v1/admin/category-systems/flat-restricted/categories",
          routeFamilies: {
            ...catalogueCategorySystemDefinition.routeFamilies,
            generic: {
              ...catalogueCategorySystemDefinition.routeFamilies.generic,
              basePath: "/admin/category-systems/catalogue/categories",
            },
          },
        },
      ]),
    ).toThrow();
  });

  it("keeps test-only restricted definitions out of the production registry", () => {
    const restricted = createRestrictedCategorySystemDefinition(
      "flat-restricted",
    );

    expect(categorySystemRegistry.getBySystemKey(restricted.systemKey)).toBe(
      undefined,
    );
    expect(categorySystemRegistry.getByResource(restricted.resource)).toBe(
      undefined,
    );
    expect(categorySystemRegistry.projectResources()).not.toContainEqual(
      expect.objectContaining({ resource: restricted.resource }),
    );
  });

  it("freezes deterministic projections and supports a restricted list/detail subset", () => {
    const restricted = createRestrictedCategorySystemDefinition(
      "flat-restricted",
    );
    const registry = createCategorySystemRegistry([restricted]);
    const resources = registry.projectResources();
    const navigation = registry.projectNavigation();

    expect(registry.getRouteFamily("flat-restricted", "generic")).toMatchObject(
      { basePath: "/admin/category-systems/flat-restricted/categories" },
    );
    expect(resources).toHaveLength(1);
    expect(navigation).toHaveLength(1);
    expect(Object.isFrozen(resources)).toBe(true);
    expect(Object.isFrozen(resources[0])).toBe(true);
    expect(Object.isFrozen(navigation)).toBe(true);
    expect(Object.isFrozen(navigation[0])).toBe(true);
  });
});
