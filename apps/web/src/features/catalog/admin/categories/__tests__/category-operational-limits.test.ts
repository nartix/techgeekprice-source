import { describe, expect, it } from "vitest";

import { resolveCategoryOperationalLimit } from "../category-system/category-operational-limits";

describe("resolveCategoryOperationalLimit", () => {
  it.each([
    [25, null, 25],
    [25, 50, 25],
    [100, 50, 50],
    [undefined, null, undefined],
    [undefined, 50, undefined],
  ] as const)(
    "resolves preference %s against maximum %s",
    (preference, maximum, expected) => {
      expect(resolveCategoryOperationalLimit(preference, maximum)).toBe(
        expected,
      );
    },
  );
});
