import { describe, expect, it } from "vitest";

import { parseCategoryRouteId } from "../category-admin-route-params";

describe("category admin route params", () => {
  it("accepts safe positive numeric category ids", () => {
    expect(parseCategoryRouteId("42")).toBe("42");
    expect(parseCategoryRouteId(" 42 ")).toBe("42");
    expect(parseCategoryRouteId("001")).toBe("1");
  });

  it.each(["", " ", "0", "-1", "1.5", "cat_1", `${Number.MAX_SAFE_INTEGER + 1}`])(
    "rejects invalid category route id %s",
    (id) => {
      expect(parseCategoryRouteId(id)).toBeNull();
    },
  );
});
