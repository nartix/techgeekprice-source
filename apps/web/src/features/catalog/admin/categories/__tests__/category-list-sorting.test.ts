import type { AdminCategoryCapabilitiesDto } from "@tgp/contracts";
import { describe, expect, it } from "vitest";

import {
  isCategoryPlacementModeAvailable,
  resolveCategoryListDefaultSorters,
  resolveCategoryListSorters,
} from "../category-list-sorting";
import { productCategoryAliasConfig } from "./category-system.fixtures";
import { parseCategoryListingScope } from "../category-listing-scope";
import type { CategoryCapabilitiesState } from "../types/category-admin.types";
import { createCatalogueCapabilities } from "./category-capability.fixtures";

describe("category-list-sorting", () => {
  it("uses updatedAt desc for all mode and never rank sort", () => {
    expect(resolveCategoryListDefaultSorters(scope(), ready())).toEqual([
      { field: "updatedAt", order: "desc" },
    ]);
    expect(
      resolveCategoryListSorters({
        scope: scope(),
        capabilitiesState: ready(),
        requestedSorters: [{ field: "sortRank", order: "asc" }],
      }),
    ).toEqual([]);
  });

  it("uses ranked sibling order only when rank is available and exposed", () => {
    expect(
      resolveCategoryListDefaultSorters(scope("parentId=0"), ready()),
    ).toEqual([
      { field: "sortRank", order: "asc" },
      { field: "id", order: "asc" },
    ]);
  });

  it("uses sanitized fallback order for unranked or unexposed capabilities", () => {
    const state = ready({
      rankingEnabled: false,
      sortRankExposed: false,
      fallbackOrder: [
        { property: "name", direction: "ASC" },
        { property: "sortRank", direction: "ASC" },
        { property: "unknown" as never, direction: "DESC" },
      ],
    });

    expect(resolveCategoryListDefaultSorters(scope("parentId=9"), state)).toEqual([
      { field: "name", order: "asc" },
    ]);
  });

  it("sends no explicit sibling default sort while capabilities load or fail", () => {
    expect(
      resolveCategoryListDefaultSorters(scope("parentId=0"), { status: "loading" }),
    ).toEqual([]);
    expect(
      resolveCategoryListDefaultSorters(scope("parentId=0"), {
        status: "error",
        error: new Error("failed"),
      }),
    ).toEqual([]);
  });

  it("rejects unsupported sort fields and forbidden sortRank desc", () => {
    expect(
      resolveCategoryListSorters({
        scope: scope("parentId=0"),
        capabilitiesState: ready(),
        requestedSorters: [
          { field: "sortRank", order: "desc" },
          { field: "unknown", order: "asc" },
          { field: "slug", order: "asc" },
        ],
      }),
    ).toEqual([{ field: "slug", order: "asc" }]);
  });

  it("applies the same safe default and sibling sort rules to Product Categories scopes", () => {
    const productListHref = productCategoryAliasConfig.listHref;

    expect(resolveCategoryListDefaultSorters(scope("", productListHref), ready()))
      .toEqual([{ field: "updatedAt", order: "desc" }]);
    expect(
      resolveCategoryListDefaultSorters(
        scope("parentId=0", productListHref),
        ready(),
      ),
    ).toEqual([
      { field: "sortRank", order: "asc" },
      { field: "id", order: "asc" },
    ]);
    expect(
      resolveCategoryListSorters({
        scope: scope("parentId=0", productListHref),
        capabilitiesState: ready(),
        requestedSorters: [
          { field: "sortRank", order: "desc" },
          { field: "name", order: "asc" },
          { field: "unsupported", order: "asc" },
        ],
      }),
    ).toEqual([{ field: "name", order: "asc" }]);
  });

  it("checks placement modes only when ranking is safe", () => {
    expect(isCategoryPlacementModeAvailable(ready(), "APPEND")).toBe(true);
    expect(
      isCategoryPlacementModeAvailable(
        ready({ placementModes: ["BEFORE_ID"] }),
        "APPEND",
      ),
    ).toBe(false);
    expect(
      isCategoryPlacementModeAvailable(
        ready({ sortRankExposed: false }),
        "APPEND",
      ),
    ).toBe(false);
  });
});

function scope(query = "", listHref = productCategoryAliasConfig.listHref) {
  return parseCategoryListingScope(new URLSearchParams(query), listHref).scope;
}

function ready(
  overrides: Partial<AdminCategoryCapabilitiesDto> = {},
): CategoryCapabilitiesState {
  return {
    status: "ready",
    capabilities: createCatalogueCapabilities({
      fallbackOrder: [{ property: "name", direction: "ASC" }],
      ordering: {
        ...createCatalogueCapabilities().ordering,
        fallbackOrder: [{ property: "name", direction: "ASC" }],
      },
      ...overrides,
    }),
  };
}
