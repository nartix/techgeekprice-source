import { describe, expect, it } from "vitest";

import { resolveCategoryRoute } from "../category-system/category-route-resolution";

const readPermissions = ["admin:catalogue-categories:read"];
const writePermissions = [
  "admin:catalogue-categories:read",
  "admin:catalogue-categories:write",
];

describe("category route resolution", () => {
  it("resolves an exact generic catalogue detail identity before screen composition", () => {
    expect(
      resolveCategoryRoute({
        systemKey: "catalogue",
        routeFamilyKey: "generic",
        screen: "detail",
        locale: "en-CA",
        id: "42",
        permissions: readPermissions,
      }),
    ).toMatchObject({
      status: "ready",
      screen: "detail",
      locale: "en-CA",
      identifier: 42,
      definition: { systemKey: "catalogue" },
      routeFamily: {
        key: "generic",
        basePath: "/admin/category-systems/catalogue/categories",
      },
    });
  });

  it("returns not-found for unknown, mixed-case, and encoded-separator keys", () => {
    for (const systemKey of ["unknown", "Catalogue", "catalogue%2Fother"]) {
      expect(
        resolveCategoryRoute({
          systemKey,
          routeFamilyKey: "generic",
          screen: "list",
          locale: "en-CA",
          permissions: readPermissions,
        }),
      ).toEqual({ status: "not-found" });
    }
  });

  it("denies a known route before disclosing invalid identifiers", () => {
    expect(
      resolveCategoryRoute({
        systemKey: "catalogue",
        routeFamilyKey: "generic",
        screen: "edit",
        locale: "en-CA",
        id: "invalid",
        permissions: readPermissions,
      }),
    ).toEqual({ status: "forbidden" });
  });

  it("rejects missing or non-canonical detail IDs and child scope IDs", () => {
    for (const request of [
      { screen: "detail" as const },
      { screen: "detail" as const, id: "02" },
      { screen: "list" as const, parentId: "0" },
      { screen: "list" as const, parentId: "1.5" },
    ]) {
      expect(
        resolveCategoryRoute({
          systemKey: "catalogue",
          routeFamilyKey: "generic",
          locale: "en-CA",
          permissions: writePermissions,
          ...request,
        }),
      ).toEqual({ status: "not-found" });
    }
  });

  it("retains the alias route family when resolving Product Categories", () => {
    expect(
      resolveCategoryRoute({
        systemKey: "catalogue",
        routeFamilyKey: "product-categories",
        screen: "create",
        locale: "fr-CA",
        permissions: writePermissions,
      }),
    ).toMatchObject({
      status: "ready",
      routeFamily: {
        key: "product-categories",
        basePath: "/admin/products/categories",
      },
    });
  });
});
