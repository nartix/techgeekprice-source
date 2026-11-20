import { describe, expect, it, vi } from "vitest";

import {
  classifySmallCategoryTreeMoveError,
  createAppendCategoryMovePayload,
  parsePositiveCategoryId,
  submitAppendCategoryMove,
} from "../tree/category-tree-mutations";

describe("small category tree move mutations", () => {
  it("parses safe positive IDs and rejects invalid category identifiers", () => {
    expect(parsePositiveCategoryId("42")).toBe(42);
    expect(parsePositiveCategoryId(42)).toBe(42);

    for (const value of ["", "0", "-1", "1.5", "abc", Number.MAX_SAFE_INTEGER + 1]) {
      expect(() => parsePositiveCategoryId(value)).toThrow(/positive/i);
    }
  });

  it("creates append/root move payloads without explicit placement fields", () => {
    expect(createAppendCategoryMovePayload("4")).toEqual({ newParentId: 4 });
    expect(createAppendCategoryMovePayload(null)).toEqual({ newParentId: null });
    expect(createAppendCategoryMovePayload("")).toEqual({ newParentId: null });
    expect(createAppendCategoryMovePayload("4")).not.toHaveProperty("beforeId");
    expect(createAppendCategoryMovePayload("4")).not.toHaveProperty("afterId");
    expect(createAppendCategoryMovePayload("4")).not.toHaveProperty(
      "targetIndex",
    );
  });

  it("submits append moves through the admin data provider", async () => {
    const custom = vi.fn().mockResolvedValue({ data: { id: 1 } });

    await submitAppendCategoryMove({
      categoryId: "1",
      dataProvider: { custom },
      newParentId: "4",
    });

    expect(custom).toHaveBeenCalledWith({
      method: "post",
      payload: { newParentId: 4 },
      url: "/api/v1/admin/category-systems/catalogue/categories/1/move",
    });
  });

  it("submits configured catalogue append moves without placement fields", async () => {
    const custom = vi.fn().mockResolvedValue({ data: { id: 1 } });

    await submitAppendCategoryMove({
      apiBasePath: "/api/v1/admin/category-systems/catalogue/categories",
      categoryId: "1",
      dataProvider: { custom },
      newParentId: "4",
    });

    expect(custom).toHaveBeenCalledWith({
      method: "post",
      payload: { newParentId: 4 },
      url: "/api/v1/admin/category-systems/catalogue/categories/1/move",
    });
    expect(custom.mock.calls[0]?.[0].payload).not.toHaveProperty("beforeId");
    expect(custom.mock.calls[0]?.[0].payload).not.toHaveProperty("afterId");
    expect(custom.mock.calls[0]?.[0].payload).not.toHaveProperty("targetIndex");
  });

  it("does not submit an append move after its authority has been revoked", async () => {
    const custom = vi.fn().mockResolvedValue({ data: { id: 1 } });

    await expect(
      submitAppendCategoryMove({
        categoryId: "1",
        dataProvider: { custom },
        enabled: false,
        newParentId: "4",
      }),
    ).rejects.toThrow(/unavailable/i);

    expect(custom).not.toHaveBeenCalled();
  });

  it.each([
    [409, "CATEGORY_TREE_STALE", "stale", true, false],
    [409, "UNSUPPORTED_CATEGORY_PLACEMENT", "unsupportedPlacement", true, true],
    [409, "INVALID_CATEGORY_PLACEMENT_TARGET", "invalidPlacementTarget", true, false],
    [409, "CATEGORY_RANK_REBALANCE_REJECTED", "rankRebalanceRejected", true, false],
    [404, "CATEGORY_NOT_FOUND", "categoryNotFound", true, false],
    [400, "VALIDATION_FAILED", "validationFailed", false, false],
    [401, "AUTH_REQUIRED", "unauthorized", false, false],
    [403, "ACCESS_DENIED", "forbidden", false, false],
    [500, "SERVER_ERROR", "genericError", false, false],
  ] as const)(
    "classifies status %s and backend code %s",
    (status, code, expectedCode, refreshTree, refreshCapabilities) => {
      expect(
        classifySmallCategoryTreeMoveError({
          status,
          details: { code, message: "Backend message" },
        }),
      ).toMatchObject({
        code: expectedCode,
        refreshCapabilities,
        refreshTree,
      });
    },
  );
});
