import { describe, expect, it } from "vitest";

import {
  DEFAULT_ADMIN_TABLE_SORT,
  applyAdminTablePageSize,
  createAdminTablePaginationState,
  createAdminTableSortingState,
  createDefaultAdminTablePageMetadata,
  resetAdminTablePageIndex,
  toAdminTableDisplayMetadata,
  toRefinePagination,
  toRefineSorters,
} from "../admin-table-state";

describe("admin-table-state", () => {
  it("maps zero-based TanStack pagination to one-based Refine pagination", () => {
    expect(
      toRefinePagination({
        pageIndex: 0,
        pageSize: 20,
      }),
    ).toEqual({
      currentPage: 1,
      pageSize: 20,
      mode: "server",
    });

    expect(
      toRefinePagination({
        pageIndex: 4,
        pageSize: 50,
      }),
    ).toMatchObject({
      currentPage: 5,
      pageSize: 50,
    });
  });

  it("uses updatedAt descending as the default server sort", () => {
    expect(DEFAULT_ADMIN_TABLE_SORT).toEqual({
      field: "updatedAt",
      order: "desc",
    });
    expect(createAdminTableSortingState()).toEqual([
      {
        id: "updatedAt",
        desc: true,
      },
    ]);
    expect(toRefineSorters([])).toEqual([
      {
        field: "updatedAt",
        order: "desc",
      },
    ]);
  });

  it("maps TanStack sorting to Refine server sorters", () => {
    expect(
      toRefineSorters([
        {
          id: "title",
          desc: false,
        },
      ]),
    ).toEqual([
      {
        field: "title",
        order: "asc",
      },
    ]);

    expect(
      toRefineSorters([
        {
          id: "email",
          desc: true,
        },
      ]),
    ).toEqual([
      {
        field: "email",
        order: "desc",
      },
    ]);
  });

  it("supports multi-sort defaults and multi-sort table state", () => {
    const defaultSort = [
      { field: "sortRank", order: "asc" as const },
      { field: "id", order: "asc" as const },
    ];

    expect(createAdminTableSortingState(defaultSort)).toEqual([
      { id: "sortRank", desc: false },
      { id: "id", desc: false },
    ]);
    expect(toRefineSorters([], defaultSort)).toEqual(defaultSort);
  });

  it("allows callers to resolve final sorters from table sorting", () => {
    expect(
      toRefineSorters(
        [{ id: "sortRank", desc: true }],
        [{ field: "sortRank", order: "asc" }],
        ({ sorting }) =>
          sorting[0]?.id === "sortRank" && sorting[0].desc
            ? []
            : [{ field: "sortRank", order: "asc" }],
      ),
    ).toEqual([]);
  });

  it("enforces allowed page sizes and resets to the first page on size change", () => {
    expect(createAdminTablePaginationState()).toEqual({
      pageIndex: 0,
      pageSize: 20,
    });

    expect(
      applyAdminTablePageSize(
        {
          pageIndex: 3,
          pageSize: 20,
        },
        50,
      ),
    ).toEqual({
      pageIndex: 0,
      pageSize: 50,
    });

    expect(() =>
      applyAdminTablePageSize(
        {
          pageIndex: 0,
          pageSize: 20,
        },
        100,
      ),
    ).toThrow(RangeError);
  });

  it("resets page index without changing page size for sorting changes", () => {
    expect(
      resetAdminTablePageIndex({
        pageIndex: 6,
        pageSize: 10,
      }),
    ).toEqual({
      pageIndex: 0,
      pageSize: 10,
    });
  });

  it("creates default page metadata from current pagination and row count", () => {
    expect(
      createDefaultAdminTablePageMetadata(
        {
          pageIndex: 1,
          pageSize: 10,
        },
        22,
      ),
    ).toEqual({
      number: 1,
      size: 10,
      totalElements: 22,
      totalPages: 3,
      numberOfElements: 22,
      first: false,
      last: false,
    });
  });

  it("preserves out-of-range backend metadata without clamping the display page", () => {
    expect(
      toAdminTableDisplayMetadata(
        {
          number: 5,
          size: 20,
          totalElements: 41,
          totalPages: 2,
          numberOfElements: 0,
          first: false,
          last: true,
        },
        {
          pageIndex: 5,
          pageSize: 20,
        },
      ),
    ).toEqual({
      page: 6,
      totalPages: 2,
      total: 41,
      numberOfElements: 0,
      outOfRange: true,
    });
  });
});
