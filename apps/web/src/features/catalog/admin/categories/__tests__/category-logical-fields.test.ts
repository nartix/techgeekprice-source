import { describe, expect, it } from "vitest";

import {
  toAdminCategoryPublicProperty,
  toAdminCategorySortProperty,
} from "../category-system/category-logical-fields";

describe("category logical fields", () => {
  it.each([
    ["identifier", "id"],
    ["parent", "parentId"],
    ["name", "name"],
    ["slug", "slug"],
    ["active", "active"],
    ["created-at", "createdAt"],
    ["updated-at", "updatedAt"],
    ["rank", "sortRank"],
  ] as const)("maps %s to %s", (field, property) => {
    expect(toAdminCategoryPublicProperty(field)).toBe(property);
    expect(toAdminCategorySortProperty(field)).toBe(property);
  });

  it("never exposes hierarchy context as a sort property", () => {
    expect(toAdminCategoryPublicProperty("hierarchy-context")).toBeUndefined();
    expect(toAdminCategorySortProperty("hierarchy-context")).toBeUndefined();
  });
});
