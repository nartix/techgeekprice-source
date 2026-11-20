import { act, renderHook } from "../../../../../../tests/test-utils/render";
import { describe, expect, it, vi } from "vitest";

import { catalogueCategorySystemDefinition } from "../category-system/catalogue-category-system.definition";
import {
  CategorySystemRuntimeProvider,
  useCategorySystemRuntime,
} from "../category-system/CategorySystemRuntimeProvider";
import { useAdminCategorySystemCapabilities } from "../hooks/useAdminCategorySystemCapabilities";
import { createCatalogueCapabilities } from "./category-capability.fixtures";

vi.mock("../hooks/useAdminCategorySystemCapabilities", () => ({
  useAdminCategorySystemCapabilities: vi.fn(),
}));

const capabilityHookMock = vi.mocked(useAdminCategorySystemCapabilities);

describe("CategorySystemRuntimeProvider", () => {
  it("keeps authority identity-bound and removes it immediately for an explicit refresh", () => {
    capabilityHookMock.mockImplementation(
      ({ apiBasePath, refreshGeneration, systemKey }) =>
        ({
          status: "loading",
          identity: { apiBasePath, systemKey },
          refreshGeneration,
        }) as never,
    );

    const { result } = renderHook(() => useCategorySystemRuntime(), {
      wrapper: ({ children }) => (
        <CategorySystemRuntimeProvider
          definition={catalogueCategorySystemDefinition}
          identityPermissions={["admin:catalogue-categories:read"]}
        >
          {children}
        </CategorySystemRuntimeProvider>
      ),
    });

    expect(
      result.current.permissions.has("admin:catalogue-categories:read"),
    ).toBe(true);
    expect(result.current.capabilityState.status).toBe("loading");

    act(() => result.current.refresh());

    expect(capabilityHookMock).toHaveBeenLastCalledWith(
      expect.objectContaining({ refreshGeneration: 1 }),
    );
  });

  it("derives effective local limits only from the current ready capability response", () => {
    capabilityHookMock.mockReturnValue({
      status: "ready",
      identity: {
        apiBasePath: catalogueCategorySystemDefinition.apiBasePath,
        systemKey: "catalogue",
      },
      capabilities: createCatalogueCapabilities({
        limits: {
          ...createCatalogueCapabilities().limits,
          parentOptionPageSize: 10,
        },
      }),
    } as never);

    const { result } = renderHook(() => useCategorySystemRuntime(), {
      wrapper: ({ children }) => (
        <CategorySystemRuntimeProvider
          definition={catalogueCategorySystemDefinition}
          identityPermissions={[]}
        >
          {children}
        </CategorySystemRuntimeProvider>
      ),
    });

    expect(result.current.effectiveLimits.parentOptionPageSize).toBe(10);
  });
});
