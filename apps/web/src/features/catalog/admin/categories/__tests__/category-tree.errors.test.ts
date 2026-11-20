import { describe, expect, it } from "vitest";

import {
  classifySmallCategoryTreeLoadError,
  INCOMPLETE_TREE_RESPONSE_CODE,
} from "../tree/api/category-tree.errors";

describe("small category tree load error classification", () => {
  it.each([
    [409, "CATEGORY_TREE_TOO_LARGE", "too-large"],
    [401, "AUTH_REQUIRED", "unauthorized"],
    [403, "ACCESS_DENIED", "forbidden"],
    [400, "INVALID_SORT_FIELD", "invalid-sort"],
    [400, "VALIDATION_FAILED", "invalid-request"],
  ] as const)("maps status %s and backend code %s", (status, code, expectedCode) => {
    expect(
      classifySmallCategoryTreeLoadError({
        status,
        details: { code, message: "Backend message" },
      }).code,
    ).toBe(expectedCode);
  });

  it("maps statusCode and response status shapes from HTTP clients", () => {
    expect(
      classifySmallCategoryTreeLoadError({
        statusCode: 409,
        details: { code: "CATEGORY_TREE_TOO_LARGE" },
      }).code,
    ).toBe("too-large");
    expect(
      classifySmallCategoryTreeLoadError({
        response: {
          status: 409,
          data: { code: "CATEGORY_TREE_TOO_LARGE" },
        },
      }).code,
    ).toBe("too-large");
  });

  it("prefers backend error codes over API client wrapper codes", () => {
    expect(
      classifySmallCategoryTreeLoadError({
        code: "api_client.admin.conflict",
        status: 409,
        details: { code: "CATEGORY_TREE_TOO_LARGE" },
      }).code,
    ).toBe("too-large");
  });

  it("maps incomplete response assertion failures to incomplete-tree-response", () => {
    expect(
      classifySmallCategoryTreeLoadError({
        code: INCOMPLETE_TREE_RESPONSE_CODE,
        message: "Incomplete response",
      }).code,
    ).toBe("incomplete-tree-response");
  });

  it("falls back to load-failed without exposing unsafe details", () => {
    const result = classifySmallCategoryTreeLoadError(
      new Error("stack trace and private backend detail"),
    );

    expect(result).toMatchObject({
      code: "load-failed",
      retryable: true,
    });
    expect(result.message).toBe("load-failed");
  });
});
