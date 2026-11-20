import { describe, expect, it, vi } from "vitest";

import type { AdminFormOptionLoaderApi } from "../../../../platform/admin/forms";
import {
  CATEGORY_PARENT_OPTION_LIMIT,
  CATEGORY_PARENT_OPTIONS_URL,
  classifyCategoryParentOptionError,
  createCategoryParentOptionQuery,
  loadCategoryParentOptionSlice,
} from "../category-parent-options.api";

describe("category parent option API", () => {
  it("serializes the first slice query with bounded defaults and omits blank values", () => {
    expect(
      createCategoryParentOptionQuery({
        cursor: " ",
        excludeSubtreeId: "",
        q: "   ",
        selectedParentId: "",
      }),
    ).toEqual({
      limit: CATEGORY_PARENT_OPTION_LIMIT,
    });
  });

  it("serializes search, selected hydration, subtree exclusion, opaque cursor, and inactive hydration", () => {
    expect(
      createCategoryParentOptionQuery({
        cursor: "cursor%2Bopaque==",
        excludeSubtreeId: "4",
        q: "  123 cameras  ",
        selectedParentId: "2",
      }),
    ).toEqual({
      cursor: "cursor%2Bopaque==",
      excludeSubtreeId: 4,
      includeIds: [2],
      includeInactive: true,
      limit: CATEGORY_PARENT_OPTION_LIMIT,
      q: "123 cameras",
    });
  });

  it("serializes repeated selected hydration identifiers without invalid values", () => {
    expect(
      createCategoryParentOptionQuery({
        selectedParentIds: ["2", 3, "bad", 0, 3],
      }),
    ).toEqual({
      includeIds: [2, 3],
      includeInactive: true,
      limit: CATEGORY_PARENT_OPTION_LIMIT,
    });
  });

  it("omits invalid selected IDs and invalid subtree IDs", () => {
    expect(
      createCategoryParentOptionQuery({
        excludeSubtreeId: -1,
        selectedParentId: "root",
      }),
    ).toEqual({
      limit: CATEGORY_PARENT_OPTION_LIMIT,
    });
  });

  it("forwards request details and AbortSignal through the form API", async () => {
    const controller = new AbortController();
    const api = createApi();

    await loadCategoryParentOptionSlice({
      apiBasePath: "/api/v1/admin/category-systems/catalogue/categories",
      api,
      cursor: "next-window",
      excludeSubtreeId: 4,
      q: "Accessories",
      selectedParentId: 2,
      signal: controller.signal,
    });

    expect(api.custom).toHaveBeenCalledWith({
      method: "get",
      query: {
        cursor: "next-window",
        excludeSubtreeId: 4,
        includeIds: [2],
        includeInactive: true,
        limit: CATEGORY_PARENT_OPTION_LIMIT,
        q: "Accessories",
      },
      signal: controller.signal,
      url: "/api/v1/admin/category-systems/catalogue/categories/parent-options",
    });
  });

  it("uses the catalogue parent-options URL when no API base path is configured", async () => {
    const api = createApi();

    await loadCategoryParentOptionSlice({
      api,
    });

    expect(api.custom).toHaveBeenCalledWith({
      method: "get",
      query: {
        limit: CATEGORY_PARENT_OPTION_LIMIT,
      },
      signal: undefined,
      url: CATEGORY_PARENT_OPTIONS_URL,
    });
  });

  it("classifies blocking and retryable errors", () => {
    expect(
      classifyCategoryParentOptionError({ status: 404 }, { excludeSubtreeId: 4 }),
    ).toEqual(
      expect.objectContaining({
        code: "stale-category",
        retryable: false,
        status: 404,
      }),
    );
    expect(
      classifyCategoryParentOptionError({ status: 409 }, { cursor: "bad" }),
    ).toEqual(
      expect.objectContaining({
        code: "cursor-reset-failed",
        retryable: true,
        status: 409,
      }),
    );
    expect(classifyCategoryParentOptionError({ status: 401 }, {})).toEqual(
      expect.objectContaining({
        code: "unauthorized",
        retryable: false,
      }),
    );
    expect(classifyCategoryParentOptionError({ status: 403 }, {})).toEqual(
      expect.objectContaining({
        code: "forbidden",
        retryable: false,
      }),
    );
  });
});

function createApi(): AdminFormOptionLoaderApi {
  return {
    custom: vi.fn(async () => ({
      data: [],
      hasMore: false,
      nextCursor: null,
    })) as unknown as AdminFormOptionLoaderApi["custom"],
    loadOptions: vi.fn(),
  };
}
