import { describe, expect, it } from "vitest";

import {
  getLocaleFromPathname,
  toLocalizedAdminLoginPath,
  toLocalizedAdminLogoutRedirect,
  toLocalizedAdminPath,
} from "../navigation/adminLocalePaths";

describe("adminLocalePaths", () => {
  it("preserves the default locale in admin links", () => {
    expect(toLocalizedAdminPath("en-CA")).toBe("/en-CA/admin");
    expect(toLocalizedAdminLoginPath("en-CA")).toBe("/en-CA/admin/login");
  });

  it("preserves non-default locale links and redirects", () => {
    expect(toLocalizedAdminPath("fr-CA", "/admin/products/categories")).toBe(
      "/fr-CA/admin/products/categories",
    );
    expect(toLocalizedAdminLogoutRedirect("fr-CA")).toBe("/fr-CA/admin/login");
  });

  it("recovers locale from localized paths and falls back to default", () => {
    expect(getLocaleFromPathname("/en-US/admin/users")).toBe("en-US");
    expect(getLocaleFromPathname("/fr-CA/admin")).toBe("fr-CA");
    expect(getLocaleFromPathname("/admin")).toBe("en-CA");
  });
});
