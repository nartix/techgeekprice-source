import { describe, expect, it } from "vitest";

import enCaMessages from "../../../../../messages/en-CA.json";
import enUsMessages from "../../../../../messages/en-US.json";
import frCaMessages from "../../../../../messages/fr-CA.json";

describe("admin message namespaces", () => {
  it("keeps Admin keys complete across supported locales", () => {
    const enCaKeys = collectKeys(enCaMessages.Admin);

    expect(collectKeys(enUsMessages.Admin)).toEqual(enCaKeys);
    expect(collectKeys(frCaMessages.Admin)).toEqual(enCaKeys);
  });

  it("includes shared admin table accessibility and hydration labels", () => {
    expect(collectKeys(enCaMessages.Admin.Table)).toEqual([
      "hydration.errorMessage",
      "hydration.errorTitle",
      "sort.ascendingLabel",
      "sort.descendingLabel",
      "sort.inactiveLabel",
      "status.refetching",
    ]);
  });

  it("includes shared admin detail state labels and route metadata titles", () => {
    expect(collectKeys(enCaMessages.Admin.Detail)).toEqual([
      "emptyMessage",
      "emptyTitle",
      "invalidMessage",
      "invalidTitle",
      "notFoundMessage",
      "notFoundTitle",
      "panelErrorMessage",
      "panelErrorTitle",
    ]);
    expect(collectKeys(enCaMessages.Admin.Metadata)).toEqual([
      "dashboardTitle",
      "loginTitle",
      "productCategoriesTitle",
      "userCreateTitle",
      "userEditTitle",
      "userShowTitle",
      "usersTitle",
    ]);
  });

  it("uses ProductCategories as the admin category UI namespace", () => {
    expect(enCaMessages.Admin).not.toHaveProperty("Categories");
    expect(collectKeys(enCaMessages.Admin.ProductCategories)).toContain(
      "list.createCategory",
    );
    expect(collectKeys(enCaMessages.Admin.ProductCategories)).toContain(
      "tree.actions.openList",
    );
  });
});

function collectKeys(value: unknown, prefix = ""): string[] {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return [prefix];
  }

  return Object.entries(value)
    .flatMap(([key, child]) =>
      collectKeys(child, prefix ? `${prefix}.${key}` : key),
    )
    .sort();
}
