import { useList } from "@refinedev/core";
import type { ColumnDef } from "@tanstack/react-table";
import {
  act,
  renderHook,
  waitFor,
} from "../../../../../../tests/test-utils/render";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { AdminIdentity } from "../../types/admin.types";
import type { AdminResourceTableConfig } from "../admin-resource-table.types";
import { useAdminResourceTable } from "../useAdminResourceTable";

vi.mock("@refinedev/core", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@refinedev/core")>();

  return {
    ...actual,
    useList: vi.fn(),
  };
});

interface TestDto {
  id: string;
  name: string;
}

interface TestRow {
  id: string;
  name: string;
}

const columns: Array<ColumnDef<TestRow, unknown>> = [
  {
    accessorKey: "name",
    header: "Name",
  },
];

const useListMock = vi.mocked(useList);

describe("useAdminResourceTable", () => {
  beforeEach(() => {
    useListMock.mockReset();
    useListMock.mockReturnValue(listResult());
  });

  it("maps Refine pagination, server sorting, and rows", () => {
    const { result } = renderHook(() =>
      useAdminResourceTable({
        config: tableConfig(),
        identity: adminIdentity(),
        locale: "en-CA",
      }),
    );

    expect(useListMock).toHaveBeenCalledWith(
      expect.objectContaining({
        resource: "productCategories",
        pagination: {
          currentPage: 1,
          pageSize: 20,
          mode: "server",
        },
        sorters: [{ field: "updatedAt", order: "desc" }],
        queryOptions: { enabled: true },
      }),
    );
    expect(result.current.rows).toEqual([{ id: "dto_1", name: "Alpha" }]);
  });

  it("passes external filters to Refine", () => {
    renderHook(() =>
      useAdminResourceTable({
        config: tableConfig(),
        externalFilters: [{ field: "parentId", operator: "eq", value: 0 }],
        identity: adminIdentity(),
        locale: "en-CA",
      }),
    );

    expect(useListMock).toHaveBeenCalledWith(
      expect.objectContaining({
        filters: [{ field: "parentId", operator: "eq", value: 0 }],
      }),
    );
  });

  it("keeps the query enabled by default and accepts a caller gate", () => {
    renderHook(() =>
      useAdminResourceTable({
        config: tableConfig(),
        identity: adminIdentity(),
        locale: "en-CA",
        queryEnabled: false,
      }),
    );

    expect(useListMock).toHaveBeenCalledWith(
      expect.objectContaining({ queryOptions: { enabled: false } }),
    );
  });

  it("uses caller-resolved sorters and preserves existing single-sort fallback", () => {
    renderHook(() =>
      useAdminResourceTable({
        config: tableConfig("productCategories", {
          defaultSort: [
            { field: "sortRank", order: "asc" },
            { field: "id", order: "asc" },
          ],
        }),
        identity: adminIdentity(),
        locale: "en-CA",
        resolveSorters: ({ defaultSort }) => defaultSort,
      }),
    );

    expect(useListMock).toHaveBeenCalledWith(
      expect.objectContaining({
        sorters: [
          { field: "sortRank", order: "asc" },
          { field: "id", order: "asc" },
        ],
      }),
    );

    useListMock.mockClear();

    renderHook(() =>
      useAdminResourceTable({
        config: tableConfig("users"),
        identity: adminIdentity(),
        locale: "en-CA",
      }),
    );

    expect(useListMock).toHaveBeenCalledWith(
      expect.objectContaining({
        sorters: [{ field: "updatedAt", order: "desc" }],
      }),
    );
  });

  it("resets to the first page when the reset key changes", () => {
    const { result, rerender } = renderHook(
      ({ resetKey }: { resetKey: string }) =>
        useAdminResourceTable({
          config: tableConfig(),
          identity: adminIdentity(),
          locale: "en-CA",
          resetKey,
        }),
      { initialProps: { resetKey: "scope:all" } },
    );

    act(() => {
      result.current.setPageIndex(4);
    });

    rerender({ resetKey: "scope:root" });

    expect(useListMock).toHaveBeenLastCalledWith(
      expect.objectContaining({
        pagination: {
          currentPage: 1,
          pageSize: 20,
          mode: "server",
        },
      }),
    );
  });

  it("resets to the first page when page size changes", () => {
    const { result } = renderHook(() =>
      useAdminResourceTable({
        config: tableConfig(),
        identity: adminIdentity(),
        locale: "en-CA",
      }),
    );

    act(() => {
      result.current.setPageIndex(3);
    });
    act(() => {
      result.current.setPageSize(50);
    });

    expect(useListMock).toHaveBeenLastCalledWith(
      expect.objectContaining({
        pagination: {
          currentPage: 1,
          pageSize: 50,
          mode: "server",
        },
      }),
    );
  });

  it("wires retry to Refine refetch", () => {
    const refetch = vi.fn();
    useListMock.mockReturnValue(listResult({ refetch }));
    const { result } = renderHook(() =>
      useAdminResourceTable({
        config: tableConfig(),
        identity: adminIdentity(),
        locale: "en-CA",
      }),
    );

    result.current.onRetry();

    expect(refetch).toHaveBeenCalledOnce();
  });

  it("preserves rows during refetching", () => {
    useListMock.mockReturnValue(listResult({ isFetching: true }));

    const { result } = renderHook(() =>
      useAdminResourceTable({
        config: tableConfig(),
        identity: adminIdentity(),
        locale: "en-CA",
      }),
    );

    expect(result.current.isFetching).toBe(true);
    expect(result.current.rows).toEqual([{ id: "dto_1", name: "Alpha" }]);
  });

  it("disables list queries and returns forbidden state when read is denied", () => {
    const { result } = renderHook(() =>
      useAdminResourceTable({
        config: tableConfig(),
        identity: null,
        locale: "en-CA",
      }),
    );

    expect(useListMock).toHaveBeenCalledWith(
      expect.objectContaining({
        queryOptions: { enabled: false },
      }),
    );
    expect(result.current.isForbidden).toBe(true);
    expect(result.current.state).toBe("forbidden");
  });

  it("keeps query enabling stable across resource permission inputs", () => {
    const cases = [
      {
        resource: "productCategories" as const,
        identity: adminIdentity({ roles: ["ADMIN"], permissions: [] }),
        enabled: false,
      },
      {
        resource: "productCategories" as const,
        identity: adminIdentity({
          roles: [],
          permissions: ["admin:catalogue-categories:read"],
        }),
        enabled: true,
      },
      {
        resource: "productCategories" as const,
        identity: adminIdentity({
          roles: [],
          permissions: ["admin:catalogue-categories:write"],
        }),
        enabled: false,
      },
      {
        resource: "users" as const,
        identity: adminIdentity({
          roles: [],
          permissions: ["admin:users:read"],
        }),
        enabled: true,
      },
    ];

    for (const item of cases) {
      useListMock.mockClear();

      renderHook(() =>
        useAdminResourceTable({
          config: tableConfig(item.resource),
          identity: item.identity,
          locale: "en-CA",
        }),
      );

      expect(useListMock).toHaveBeenCalledWith(
        expect.objectContaining({
          resource: item.resource,
          queryOptions: { enabled: item.enabled },
        }),
      );
    }
  });

  it("hydrates rows once per page and retries hydration failures safely", async () => {
    const hydrateRows = vi
      .fn()
      .mockRejectedValueOnce(new Error("raw-backend-secret"))
      .mockResolvedValueOnce([{ id: "dto_1", name: "Alpha hydrated" }]);
    const config = tableConfig("productCategories", { hydrateRows });
    const identity = adminIdentity();
    const { result } = renderHook(() =>
      useAdminResourceTable({
        config,
        identity,
        locale: "en-CA",
      }),
    );

    await waitFor(() => expect(result.current.errorSource).toBe("hydration"));
    expect(hydrateRows).toHaveBeenCalledTimes(1);
    expect(hydrateRows).toHaveBeenLastCalledWith(
      [{ id: "dto_1", name: "Alpha" }],
      expect.objectContaining({
        rows: [{ id: "dto_1", name: "Alpha" }],
      }),
    );

    act(() => {
      result.current.onRetry();
    });

    await waitFor(() =>
      expect(result.current.rows).toEqual([
        { id: "dto_1", name: "Alpha hydrated" },
      ]),
    );
    expect(hydrateRows).toHaveBeenCalledTimes(2);
  });

  it("ignores stale async hydration results", async () => {
    let data = [{ id: "dto_1", name: "Alpha" }];
    let resolveFirst:
      | ((rows: Array<{ id: string; name: string }>) => void)
      | undefined;
    const hydrateRows = vi
      .fn()
      .mockImplementationOnce(
        () =>
          new Promise<Array<{ id: string; name: string }>>((resolve) => {
            resolveFirst = resolve;
          }),
      )
      .mockResolvedValueOnce([{ id: "dto_2", name: "Beta hydrated" }]);
    const config = tableConfig("productCategories", { hydrateRows });
    const identity = adminIdentity();

    useListMock.mockImplementation(() => listResult({ data }));

    const { result, rerender } = renderHook(() =>
      useAdminResourceTable({
        config,
        identity,
        locale: "en-CA",
      }),
    );

    data = [{ id: "dto_2", name: "Beta" }];
    rerender();

    await waitFor(() =>
      expect(result.current.rows).toEqual([
        { id: "dto_2", name: "Beta hydrated" },
      ]),
    );

    act(() => {
      resolveFirst?.([{ id: "dto_1", name: "Alpha stale" }]);
    });

    expect(result.current.rows).toEqual([
      { id: "dto_2", name: "Beta hydrated" },
    ]);
  });

  it("applies beforeDisplayRow transformations, omissions, and configured row IDs", () => {
    useListMock.mockReturnValue(
      listResult({
        data: [
          { id: "dto_1", name: "Alpha" },
          { id: "dto_2", name: "Omit" },
        ],
      }),
    );

    const { result } = renderHook(() =>
      useAdminResourceTable({
        config: tableConfig("productCategories", {
          beforeDisplayRow: (row) =>
            row.name === "Omit" ? null : { ...row, name: `${row.name} row` },
          getRowId: (row) => `stable-${row.id}`,
        }),
        identity: adminIdentity(),
        locale: "en-CA",
      }),
    );

    expect(result.current.rows).toEqual([{ id: "dto_1", name: "Alpha row" }]);
    expect(result.current.table.getRowModel().rows[0]?.id).toBe("stable-dto_1");
  });
});

function tableConfig(
  resource: "productCategories" | "users" = "productCategories",
  overrides: Partial<AdminResourceTableConfig<TestDto, TestRow>> = {},
): AdminResourceTableConfig<TestDto, TestRow> {
  return {
    resource,
    getRowId: (row) => row.id,
    defaultSort: { field: "updatedAt", order: "desc" },
    columns,
    mapDtoToRow: (dto) => ({ id: dto.id, name: dto.name }),
    labels: {
      title: "Categories",
      loading: "Loading",
      empty: "Empty",
      errorTitle: "Error",
      errorMessage: "Error message",
      forbiddenTitle: "Forbidden",
      forbiddenMessage: "Forbidden message",
      retry: "Retry",
      pageMetadata: () => "Metadata",
      pageSizeLabel: "Rows per page",
      paginationLabel: "Pages",
      hydrationErrorTitle: "Hydration error",
      hydrationErrorMessage: "Hydration error message",
    },
    ...overrides,
  };
}

function adminIdentity(overrides: Partial<AdminIdentity> = {}): AdminIdentity {
  return {
    id: "admin_1",
    username: "admin",
    roles: ["ADMIN"],
    permissions: [
      "admin:catalogue-categories:read",
      "admin:catalogue-categories:write",
    ],
    sessionScope: "admin",
    ...overrides,
  };
}

function listResult({
  data = [{ id: "dto_1", name: "Alpha" }],
  isFetching = false,
  refetch = vi.fn(),
}: {
  data?: TestDto[];
  isFetching?: boolean;
  refetch?: () => void;
} = {}) {
  return {
    result: {
      data,
    },
    query: {
      data: {
        page: {
          number: 0,
          size: 20,
          totalElements: 1,
          totalPages: 1,
          numberOfElements: 1,
          first: true,
          last: true,
        },
      },
      error: null,
      isError: false,
      isFetching,
      isLoading: false,
      refetch,
    },
  } as unknown as ReturnType<typeof useList>;
}
