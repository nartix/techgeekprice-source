import { useDataProvider } from "@refinedev/core";
import { renderHook, waitFor } from "../../../../../../tests/test-utils/render";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  createAdminCategoryBreadcrumbQueryKey,
  useAdminCategoryBreadcrumb,
} from "../hooks/useAdminCategoryBreadcrumb";

vi.mock("@refinedev/core", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@refinedev/core")>();

  return {
    ...actual,
    useDataProvider: vi.fn(),
  };
});

const useDataProviderMock = vi.mocked(useDataProvider);

describe("useAdminCategoryBreadcrumb", () => {
  beforeEach(() => {
    useDataProviderMock.mockReset();
  });

  it("does not fetch for all or root scopes", () => {
    const custom = vi.fn();
    useDataProviderMock.mockReturnValue(() => ({ custom }) as never);

    const { rerender, result } = renderHook(
      ({ parentId }: { parentId: number | null }) =>
        useAdminCategoryBreadcrumb(parentId),
      { initialProps: { parentId: null as number | null } },
    );

    expect(result.current.status).toBe("idle");
    rerender({ parentId: 0 });
    expect(result.current.status).toBe("idle");
    expect(custom).not.toHaveBeenCalled();
  });

  it("does not fetch a positive breadcrumb when the current capability gate is closed", () => {
    const custom = vi.fn();
    useDataProviderMock.mockReturnValue(() => ({ custom }) as never);

    const { result } = renderHook(() =>
      useAdminCategoryBreadcrumb(123, { enabled: false }),
    );

    expect(result.current.status).toBe("idle");
    expect(custom).not.toHaveBeenCalled();
  });

  it("loads breadcrumbs for positive scopes with a stable key", async () => {
    const custom = vi.fn().mockResolvedValue({
      data: [
        {
          id: 123,
          parentId: null,
          depth: 0,
          name: "Computers",
          slug: "computers",
          active: true,
          createdAt: "2026-05-29T12:00:00.000Z",
          updatedAt: "2026-05-30T12:00:00.000Z",
        },
      ],
    });
    useDataProviderMock.mockReturnValue(() => ({ custom }) as never);

    const { result } = renderHook(() => useAdminCategoryBreadcrumb(123));

    expect(createAdminCategoryBreadcrumbQueryKey(123)).toEqual([
      "admin",
      "categories",
      "breadcrumb",
      123,
    ]);
    await waitFor(() => expect(result.current.status).toBe("ready"));
    expect(custom).toHaveBeenCalledWith({
      url: "/api/v1/admin/category-systems/catalogue/categories/123/breadcrumb",
      method: "get",
    });
  });

  it("loads configured catalogue breadcrumbs with the default catalogue key", async () => {
    const custom = vi.fn().mockResolvedValue({
      data: [
        {
          id: 123,
          parentId: null,
          depth: 0,
          name: "Computers",
          slug: "computers",
          active: true,
          createdAt: "2026-05-29T12:00:00.000Z",
          updatedAt: "2026-05-30T12:00:00.000Z",
        },
      ],
    });
    const apiBasePath = "/api/v1/admin/category-systems/catalogue/categories";

    useDataProviderMock.mockReturnValue(() => ({ custom }) as never);

    const { result } = renderHook(() =>
      useAdminCategoryBreadcrumb(123, { apiBasePath }),
    );

    expect(createAdminCategoryBreadcrumbQueryKey(123, apiBasePath)).toEqual([
      "admin",
      "categories",
      "breadcrumb",
      123,
    ]);
    await waitFor(() => expect(result.current.status).toBe("ready"));
    expect(custom).toHaveBeenCalledWith({
      url: "/api/v1/admin/category-systems/catalogue/categories/123/breadcrumb",
      method: "get",
    });
  });

  it("maps 404 errors to not-found state", async () => {
    useDataProviderMock.mockReturnValue(() => ({
      custom: vi.fn().mockRejectedValue({ status: 404 }),
    }) as never);

    const { result } = renderHook(() => useAdminCategoryBreadcrumb(123));

    await waitFor(() => expect(result.current.status).toBe("not-found"));
  });
});
