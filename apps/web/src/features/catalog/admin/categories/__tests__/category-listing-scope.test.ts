import { describe, expect, it } from "vitest";

import {
  createCategoryParentScopeFilters,
  createCategoryScopeHref,
  parseCategoryListingScope,
} from "../category-listing-scope";

const listHref = "/admin/products/categories";

describe("category-listing-scope", () => {
  it("parses omitted, root, and positive parent scopes", () => {
    expect(parseCategoryListingScope(params(), listHref).scope).toMatchObject({
      mode: "all",
      canonicalHref: "/admin/products/categories",
      resetKey: "all",
    });
    expect(parseCategoryListingScope(params("parentId=0"), listHref).scope).toMatchObject({
      mode: "root",
      parentId: 0,
      canonicalHref: "/admin/products/categories?parentId=0",
      resetKey: "root:0",
    });
    expect(parseCategoryListingScope(params("parentId=123"), listHref).scope).toMatchObject({
      mode: "children",
      parentId: 123,
      canonicalHref: "/admin/products/categories?parentId=123",
      resetKey: "children:123",
    });
  });

  it.each([
    ["blank", "parentId="],
    ["null", "parentId=null"],
    ["multiple", "parentId=0&parentId=1"],
    ["non-numeric", "parentId=abc"],
    ["negative", "parentId=-1"],
    ["signed", "parentId=%2B1"],
    ["decimal", "parentId=1.5"],
    ["exponent", "parentId=1e3"],
    ["unsafe integer", "parentId=9007199254740992"],
  ])("canonicalizes invalid %s parentId values to all mode", (_label, query) => {
    expect(parseCategoryListingScope(params(query), listHref)).toEqual({
      invalid: true,
      scope: {
        mode: "all",
        canonicalHref: "/admin/products/categories",
        resetKey: "all",
      },
    });
  });

  it("creates canonical hrefs and parent filters", () => {
    expect(createCategoryScopeHref(undefined, listHref)).toBe(listHref);
    expect(createCategoryScopeHref(0, listHref)).toBe(`${listHref}?parentId=0`);
    expect(createCategoryScopeHref(42, listHref)).toBe(`${listHref}?parentId=42`);

    expect(
      createCategoryParentScopeFilters(
        parseCategoryListingScope(params(), listHref).scope,
      ),
    ).toEqual([]);
    expect(
      createCategoryParentScopeFilters(
        parseCategoryListingScope(params("parentId=0"), listHref).scope,
      ),
    ).toEqual([{ field: "parentId", operator: "eq", value: 0 }]);
  });

  it("uses the configured list href for Product Categories scopes", () => {
    const listHref = "/admin/products/categories";

    expect(parseCategoryListingScope(params(), listHref).scope).toMatchObject({
      mode: "all",
      canonicalHref: "/admin/products/categories",
      resetKey: "all",
    });
    expect(
      parseCategoryListingScope(params("parentId=0"), listHref).scope,
    ).toMatchObject({
      mode: "root",
      parentId: 0,
      canonicalHref: "/admin/products/categories?parentId=0",
      resetKey: "root:0",
    });
    expect(
      parseCategoryListingScope(params("parentId=123"), listHref).scope,
    ).toMatchObject({
      mode: "children",
      parentId: 123,
      canonicalHref: "/admin/products/categories?parentId=123",
      resetKey: "children:123",
    });
    expect(createCategoryScopeHref(42, listHref)).toBe(
      "/admin/products/categories?parentId=42",
    );
  });

  it.each([
    ["blank", "parentId="],
    ["repeated", "parentId=0&parentId=1"],
    ["negative", "parentId=-1"],
    ["unsafe integer", "parentId=9007199254740992"],
  ])(
    "canonicalizes invalid Product Categories %s parentId values to the configured list",
    (_label, query) => {
      expect(
        parseCategoryListingScope(params(query), "/admin/products/categories"),
      ).toEqual({
        invalid: true,
        scope: {
          mode: "all",
          canonicalHref: "/admin/products/categories",
          resetKey: "all",
        },
      });
    },
  );
});

function params(query = "") {
  return new URLSearchParams(query);
}
