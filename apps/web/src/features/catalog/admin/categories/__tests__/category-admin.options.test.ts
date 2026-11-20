import { describe, expect, it, vi } from "vitest";

import type { AdminCategoryParentOptionDto } from "@tgp/contracts";

import type { AdminFormOptionLoaderApi } from "../../../../platform/admin/forms";
import { loadCategoryParentOptions } from "../category-admin.options";

describe("loadCategoryParentOptions", () => {
  it("uses the bounded parent-options endpoint for compatibility callers", async () => {
    const api = createOptionApi();

    const options = await loadCategoryParentOptions({
      api,
      excludeId: "1",
      search: " Accessories ",
    });

    expect(api.custom).toHaveBeenCalledWith(
      expect.objectContaining({
        method: "get",
        query: {
          excludeSubtreeId: 1,
          limit: 25,
          q: "Accessories",
        },
        url: "/api/v1/admin/category-systems/catalogue/categories/parent-options",
      }),
    );
    expect(options).toEqual([
      {
        disabled: false,
        label: "Accessories",
        meta: {
          active: true,
          disabledReason: null,
          parentId: null,
          selectable: true,
          slug: "accessories",
        },
        value: "2",
      },
    ]);
  });
});

function createOptionApi(): AdminFormOptionLoaderApi {
  return {
    custom: vi.fn(async () => ({
      data: [parentOption()],
      hasMore: false,
      nextCursor: null,
    })) as unknown as AdminFormOptionLoaderApi["custom"],
    loadOptions: vi.fn(),
  };
}

function parentOption(
  overrides: Partial<AdminCategoryParentOptionDto> = {},
): AdminCategoryParentOptionDto {
  return {
    active: true,
    depth: 0,
    disabledReason: null,
    id: 2,
    label: "Accessories",
    name: "Accessories",
    parentId: null,
    path: [],
    selectable: true,
    slug: "accessories",
    ...overrides,
  };
}
