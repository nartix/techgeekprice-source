import { describe, expect, it } from "vitest";

import {
  ALLOWED_ADMIN_PAGE_SIZES,
  DEFAULT_ADMIN_PAGE_SIZE,
  MAX_ADMIN_PAGE_SIZE,
  enforceAdminPageSize,
  isAllowedAdminPageSize,
} from "../utils/adminPageSizePolicy";

describe("adminPageSizePolicy", () => {
  it("uses default 20 and allowed UI sizes 3, 5, 10, 20, and 50", () => {
    expect(DEFAULT_ADMIN_PAGE_SIZE).toBe(20);
    expect(ALLOWED_ADMIN_PAGE_SIZES).toEqual([3, 5, 10, 20, 50]);
  });

  it("allows configured page sizes", () => {
    expect(isAllowedAdminPageSize(3)).toBe(true);
    expect(isAllowedAdminPageSize(5)).toBe(true);
    expect(isAllowedAdminPageSize(10)).toBe(true);
    expect(isAllowedAdminPageSize(20)).toBe(true);
    expect(isAllowedAdminPageSize(50)).toBe(true);
    expect(enforceAdminPageSize(20)).toBe(20);
  });

  it("rejects unsupported sizes and documents max 100", () => {
    expect(MAX_ADMIN_PAGE_SIZE).toBe(100);
    expect(isAllowedAdminPageSize(100)).toBe(false);
    expect(() => enforceAdminPageSize(100)).toThrow(RangeError);
    expect(() => enforceAdminPageSize(101)).toThrow(RangeError);
  });
});
