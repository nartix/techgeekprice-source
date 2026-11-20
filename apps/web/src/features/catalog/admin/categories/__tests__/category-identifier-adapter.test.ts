import { describe, expect, it } from "vitest";

import { numericLongV1CategoryIdentifierAdapter } from "../category-system/category-identifier-adapter";

describe("numericLongV1CategoryIdentifierAdapter", () => {
  it("round-trips positive safe integer identifiers", () => {
    for (const value of [1, 42, Number.MAX_SAFE_INTEGER]) {
      const serialized =
        numericLongV1CategoryIdentifierAdapter.serialize(value);

      expect(serialized).toEqual({ ok: true, value: String(value) });
      expect(
        numericLongV1CategoryIdentifierAdapter.parse(
          serialized.ok ? serialized.value : "",
        ),
      ).toEqual({ ok: true, value });
    }
  });

  it("rejects invalid numeric and serialized identifiers without throwing", () => {
    const invalidResult = { ok: false, reason: "invalid-identifier" } as const;

    for (const value of [
      Number.NaN,
      Number.POSITIVE_INFINITY,
      0,
      -1,
      1.5,
      Number.MAX_SAFE_INTEGER + 1,
    ]) {
      expect(() =>
        numericLongV1CategoryIdentifierAdapter.serialize(value),
      ).not.toThrow();
      expect(numericLongV1CategoryIdentifierAdapter.serialize(value)).toEqual(
        invalidResult,
      );
    }

    for (const value of [
      "",
      " 1",
      "1 ",
      "+1",
      "1.5",
      "1e3",
      "0",
      "-1",
      "not-a-number",
      "9007199254740992",
    ]) {
      expect(() =>
        numericLongV1CategoryIdentifierAdapter.parse(value),
      ).not.toThrow();
      expect(numericLongV1CategoryIdentifierAdapter.parse(value)).toEqual(
        invalidResult,
      );
    }
  });
});
