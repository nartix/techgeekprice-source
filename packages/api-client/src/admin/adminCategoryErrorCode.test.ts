import { ApiClientError } from "../api-client-error";
import { describe, expect, it } from "vitest";

import { extractAdminCategoryBackendErrorCode } from "./adminCategoryErrorCode";

describe("extractAdminCategoryBackendErrorCode", () => {
  it("returns only known stable codes from API client details", () => {
    const error = new ApiClientError({
      code: "api_client.response.http_error",
      message: "failed",
      details: { code: "CATEGORY_TREE_TOO_LARGE" },
    });

    expect(extractAdminCategoryBackendErrorCode(error)).toBe(
      "CATEGORY_TREE_TOO_LARGE",
    );
    expect(
      extractAdminCategoryBackendErrorCode({ details: { code: "UNKNOWN" } }),
    ).toBeUndefined();
    expect(extractAdminCategoryBackendErrorCode(null)).toBeUndefined();
  });
});
