import { describe, expect, it } from "vitest";

import { selectAdminDetailState } from "../adminDetailState";

describe("selectAdminDetailState", () => {
  it("prioritizes forbidden and invalid states before data errors", () => {
    expect(
      selectAdminDetailState({
        canRead: false,
        error: new Error("raw backend permission text"),
        hasRecord: false,
        isInvalidRouteId: true,
        isLoading: false,
        isNotFound: true,
      }),
    ).toBe("forbidden");

    expect(
      selectAdminDetailState({
        canRead: true,
        error: new Error("raw backend id text"),
        hasRecord: false,
        isInvalidRouteId: true,
        isLoading: false,
        isNotFound: true,
      }),
    ).toBe("invalid");
  });

  it("selects loading, not-found, error, empty, and ready states safely", () => {
    expect(
      selectAdminDetailState({
        canRead: true,
        error: null,
        hasRecord: false,
        isInvalidRouteId: false,
        isLoading: true,
        isNotFound: false,
      }),
    ).toBe("loading");

    expect(
      selectAdminDetailState({
        canRead: true,
        error: { status: 404 },
        hasRecord: false,
        isInvalidRouteId: false,
        isLoading: false,
        isNotFound: true,
      }),
    ).toBe("not-found");

    expect(
      selectAdminDetailState({
        canRead: true,
        error: new Error("stack trace should not render"),
        hasRecord: false,
        isInvalidRouteId: false,
        isLoading: false,
        isNotFound: false,
      }),
    ).toBe("error");

    expect(
      selectAdminDetailState({
        canRead: true,
        error: null,
        hasRecord: true,
        isEmptyContent: true,
        isInvalidRouteId: false,
        isLoading: false,
        isNotFound: false,
      }),
    ).toBe("empty");

    expect(
      selectAdminDetailState({
        canRead: true,
        error: null,
        hasRecord: true,
        isEmptyContent: false,
        isInvalidRouteId: false,
        isLoading: false,
        isNotFound: false,
      }),
    ).toBe("ready");
  });
});
