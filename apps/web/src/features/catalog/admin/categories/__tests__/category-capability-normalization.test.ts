import { describe, expect, it } from "vitest";

import { createCatalogueCapabilities } from "./category-capability.fixtures";
import { normalizeAdminCategoryCapabilities } from "../category-system/category-capability-normalization";

describe("normalizeAdminCategoryCapabilities", () => {
  it("returns a deeply frozen canonical complete capability set", () => {
    const result = normalizeAdminCategoryCapabilities(
      createCatalogueCapabilities(),
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(Object.isFrozen(result.value)).toBe(true);
    expect(Object.isFrozen(result.value.ordering)).toBe(true);
    expect(Object.isFrozen(result.value.supportedOperations)).toBe(true);
  });

  it("accepts only the documented nullable values", () => {
    const result = normalizeAdminCategoryCapabilities(
      createCatalogueCapabilities({
        hierarchy: {
          enabled: true,
          readOperations: [],
          mutationOperations: [],
          rootModel: null,
        },
        limits: {
          pageSize: null,
          searchInputLength: null,
          filterSelections: null,
          sortSelections: null,
          treeSize: null,
          parentOptionPageSize: null,
          includeIdCount: null,
          hierarchyDepth: null,
        },
      }),
    );

    expect(result.ok).toBe(true);
  });

  it.each([
    ["legacy partial payload", { rankingEnabled: true }],
    ["unknown top-level property", { extra: true }],
    ["duplicate operation", { supportedOperations: ["list", "list"] }],
    ["unknown placement mode", { placementModes: ["SOMEWHERE"] }],
    ["fractional limit", { limits: { pageSize: 1.5 } }],
    ["ordered alias mismatch", { placementModes: ["TARGET_INDEX", "APPEND"] }],
  ])("fails closed for %s", (_label, overrides) => {
    const baseline = createCatalogueCapabilities();
    const candidate =
      _label === "legacy partial payload"
        ? overrides
        : {
            ...baseline,
            ...overrides,
            limits: {
              ...baseline.limits,
              ...(overrides as { limits?: object }).limits,
            },
          };

    expect(normalizeAdminCategoryCapabilities(candidate).ok).toBe(false);
  });
});
