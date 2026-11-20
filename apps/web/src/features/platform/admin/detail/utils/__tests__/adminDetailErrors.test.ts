import { describe, expect, it } from "vitest";

import {
  getAdminDetailErrorStatus,
  getSafeAdminDetailErrorCopy,
  isAdminDetailNotFoundError,
} from "../adminDetailErrors";

describe("admin detail error helpers", () => {
  it("detects not-found status across Refine-compatible wrappers", () => {
    expect(isAdminDetailNotFoundError({ status: 404 })).toBe(true);
    expect(isAdminDetailNotFoundError({ statusCode: 404 })).toBe(true);
    expect(
      isAdminDetailNotFoundError({
        response: { status: 404, data: { message: "user user_1 exists" } },
      }),
    ).toBe(true);
    expect(
      getAdminDetailErrorStatus({
        details: { status: "404" },
      }),
    ).toBe(404);
  });

  it("ignores unsafe backend text when creating public state copy", () => {
    const copy = getSafeAdminDetailErrorCopy(
      {
        response: {
          status: 404,
          data: {
            message:
              "User user_1 was hidden by permission policy with token secret",
          },
        },
      },
      {
        errorMessage: "The record could not be loaded.",
        notFoundMessage: "The record was not found.",
      },
    );

    expect(copy).toBe("The record was not found.");
    expect(copy).not.toMatch(/user_1|permission|token|secret/i);
  });
});
