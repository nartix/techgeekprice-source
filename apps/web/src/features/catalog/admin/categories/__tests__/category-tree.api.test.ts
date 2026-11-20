import { describe, expect, it, vi } from "vitest";

import {
  assertCompleteTreePage,
  loadSmallCategoryTree,
} from "../tree/api/category-tree.api";
import { categoryTreePage, smallCategoryTree } from "./category-tree.fixtures";

describe("small category tree API", () => {
  it("loads the complete tree with page zero and no size, sort, or filters", async () => {
    const response = categoryTreePage(smallCategoryTree);
    const custom = vi.fn().mockResolvedValue({ data: response });

    await expect(
      loadSmallCategoryTree({ dataProvider: { custom } }),
    ).resolves.toEqual(response);

    expect(custom).toHaveBeenCalledOnce();
    expect(custom).toHaveBeenCalledWith({
      method: "get",
      query: { page: 0 },
      url: "/api/v1/admin/category-systems/catalogue/categories/tree",
    });
  });

  it("loads a configured catalogue tree path", async () => {
    const response = categoryTreePage(smallCategoryTree);
    const custom = vi.fn().mockResolvedValue({ data: response });

    await expect(
      loadSmallCategoryTree({
        apiBasePath: "/api/v1/admin/category-systems/catalogue/categories",
        dataProvider: { custom },
      }),
    ).resolves.toEqual(response);

    expect(custom).toHaveBeenCalledWith({
      method: "get",
      query: { page: 0 },
      url: "/api/v1/admin/category-systems/catalogue/categories/tree",
    });
  });

  it("uses the current effective tree bound and propagates the request abort signal", async () => {
    const response = categoryTreePage(smallCategoryTree);
    const controller = new AbortController();
    const custom = vi.fn().mockResolvedValue({ data: response });

    await loadSmallCategoryTree({
      dataProvider: { custom },
      signal: controller.signal,
      size: 10_000,
    });

    expect(custom).toHaveBeenCalledWith({
      method: "get",
      query: { page: 0, size: 10_000 },
      meta: { signal: controller.signal },
      url: "/api/v1/admin/category-systems/catalogue/categories/tree",
    });
  });

  it("accepts complete first-page responses", () => {
    expect(() => assertCompleteTreePage(categoryTreePage())).not.toThrow();
  });

  it.each([
    ["nonzero page", { number: 1 }],
    ["not first", { first: false }],
    ["not last", { last: false }],
    ["mismatched total", { totalElements: smallCategoryTree.length + 1 }],
  ])("rejects incomplete successful responses: %s", (_, pageOverrides) => {
    expect(() =>
      assertCompleteTreePage(
        categoryTreePage(smallCategoryTree, pageOverrides),
      ),
    ).toThrow(/incomplete/i);
  });

  it("rejects successful responses with a next link and never requests another page", async () => {
    const response = {
      ...categoryTreePage(),
      links: {
        self: "/api/v1/admin/category-systems/catalogue/categories/tree?page=0",
        next: "/api/v1/admin/category-systems/catalogue/categories/tree?page=1",
        previous: null,
      },
    };
    const custom = vi.fn().mockResolvedValue({ data: response });

    await expect(
      loadSmallCategoryTree({ dataProvider: { custom } }),
    ).rejects.toThrow(/incomplete/i);
    expect(custom).toHaveBeenCalledOnce();
  });
});
