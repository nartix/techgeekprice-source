import { useCustom } from "@refinedev/core";
import { renderHook } from "../../../../../../tests/test-utils/render";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createCatalogueCapabilities } from "./category-capability.fixtures";
import {
  createAdminCategorySystemCapabilitiesQueryKey,
  useAdminCategorySystemCapabilities,
} from "../hooks/useAdminCategorySystemCapabilities";

vi.mock("@refinedev/core", () => ({ useCustom: vi.fn() }));

const useCustomMock = vi.mocked(useCustom);
const apiBasePath =
  "/api/v1/admin/category-systems/catalogue/categories" as const;

describe("useAdminCategorySystemCapabilities", () => {
  beforeEach(() => useCustomMock.mockReset());

  it("uses the identity-bound, non-refetching custom query and normalizes before ready", () => {
    useCustomMock.mockReturnValue({
      query: { data: { data: createCatalogueCapabilities() }, isSuccess: true },
    } as never);

    const { result } = renderHook(() =>
      useAdminCategorySystemCapabilities({
        systemKey: "catalogue",
        apiBasePath,
      }),
    );

    expect(
      createAdminCategorySystemCapabilitiesQueryKey("catalogue", apiBasePath),
    ).toEqual([
      "admin-category-system-capabilities",
      "catalogue",
      apiBasePath,
      0,
    ]);
    expect(result.current).toMatchObject({
      status: "ready",
      identity: { systemKey: "catalogue", apiBasePath },
    });
    expect(useCustomMock).toHaveBeenCalledWith(
      expect.objectContaining({
        url: `${apiBasePath}/capabilities`,
        method: "get",
        meta: expect.objectContaining({
          refreshGeneration: 0,
          systemKey: "catalogue",
        }),
        queryOptions: expect.objectContaining({
          gcTime: Infinity,
          queryKey: createAdminCategorySystemCapabilitiesQueryKey(
            "catalogue",
            apiBasePath,
          ),
          refetchOnMount: false,
          refetchOnReconnect: false,
          refetchOnWindowFocus: false,
          staleTime: Infinity,
        }),
      }),
    );
  });

  it("uses a distinct replacement generation without changing identity", () => {
    useCustomMock.mockReturnValue({ query: {} } as never);

    const { result } = renderHook(() =>
      useAdminCategorySystemCapabilities({
        systemKey: "catalogue",
        apiBasePath,
        refreshGeneration: 1,
      }),
    );

    expect(result.current).toEqual({
      status: "loading",
      identity: { systemKey: "catalogue", apiBasePath },
    });
    expect(useCustomMock).toHaveBeenCalledWith(
      expect.objectContaining({
        queryOptions: expect.objectContaining({
          queryKey: createAdminCategorySystemCapabilitiesQueryKey(
            "catalogue",
            apiBasePath,
            1,
          ),
        }),
      }),
    );
  });

  it("uses one stable Refine key for same-identity observers and keeps it ready-cache eligible", () => {
    useCustomMock.mockReturnValue({ query: {} } as never);

    renderHook(() =>
      useAdminCategorySystemCapabilities({
        systemKey: "catalogue",
        apiBasePath,
      }),
    );
    renderHook(() =>
      useAdminCategorySystemCapabilities({
        systemKey: "catalogue",
        apiBasePath,
      }),
    );

    const [firstCall, secondCall] = useCustomMock.mock.calls;

    expect(firstCall?.[0]).toEqual(
      expect.objectContaining({
        queryOptions: expect.objectContaining({
          gcTime: Infinity,
          queryKey: createAdminCategorySystemCapabilitiesQueryKey(
            "catalogue",
            apiBasePath,
          ),
          refetchOnMount: false,
          refetchOnReconnect: false,
          refetchOnWindowFocus: false,
          staleTime: Infinity,
        }),
      }),
    );
    expect(secondCall?.[0]).toEqual(
      expect.objectContaining({
        queryOptions: expect.objectContaining({
          queryKey: firstCall?.[0].queryOptions?.queryKey,
        }),
      }),
    );
  });

  it("separates a changed identity from the previous request key and endpoint", () => {
    const otherApiBasePath =
      "/api/v1/admin/category-systems/other/categories" as const;
    useCustomMock.mockReturnValue({ query: {} } as never);

    renderHook(() =>
      useAdminCategorySystemCapabilities({
        systemKey: "catalogue",
        apiBasePath,
      }),
    );
    renderHook(() =>
      useAdminCategorySystemCapabilities({
        systemKey: "other",
        apiBasePath: otherApiBasePath,
      }),
    );

    const [firstCall, secondCall] = useCustomMock.mock.calls;

    expect(firstCall?.[0].queryOptions?.queryKey).not.toEqual(
      secondCall?.[0].queryOptions?.queryKey,
    );
    expect(secondCall?.[0]).toEqual(
      expect.objectContaining({
        url: `${otherApiBasePath}/capabilities`,
        queryOptions: expect.objectContaining({
          enabled: true,
          queryKey: createAdminCategorySystemCapabilitiesQueryKey(
            "other",
            otherApiBasePath,
          ),
        }),
      }),
    );
  });

  it("disables transport for an identity whose API path belongs to another system", () => {
    useCustomMock.mockReturnValue({
      query: { data: { data: createCatalogueCapabilities() }, isSuccess: true },
    } as never);

    const { result } = renderHook(() =>
      useAdminCategorySystemCapabilities({
        systemKey: "catalogue",
        apiBasePath:
          "/api/v1/admin/category-systems/other/categories" as typeof apiBasePath,
      }),
    );

    expect(useCustomMock).toHaveBeenCalledWith(
      expect.objectContaining({
        queryOptions: expect.objectContaining({ enabled: false }),
      }),
    );
    expect(result.current).toEqual({
      status: "loading",
      identity: {
        systemKey: "catalogue",
        apiBasePath: "/api/v1/admin/category-systems/other/categories",
      },
    });
    expect(result.current).not.toHaveProperty("capabilities");
  });

  it("fails closed when normalization fails", () => {
    useCustomMock.mockReturnValue({
      query: { data: { data: { rankingEnabled: true } }, isSuccess: true },
    } as never);

    const { result } = renderHook(() =>
      useAdminCategorySystemCapabilities({
        systemKey: "catalogue",
        apiBasePath,
      }),
    );

    expect(result.current.status).toBe("error");
    expect(result.current).not.toHaveProperty("capabilities");
  });
});
