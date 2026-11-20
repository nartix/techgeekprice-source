import type { AdminCategoryCapabilitiesDto } from "@tgp/contracts";

export function createCatalogueCapabilities(
  overrides: Partial<AdminCategoryCapabilitiesDto> = {},
): AdminCategoryCapabilitiesDto {
  const ordering: AdminCategoryCapabilitiesDto["ordering"] = {
    orderingEnabled: true,
    rankingEnabled: true,
    rankExposed: true,
    reorderSupported: true,
    placementModes: ["APPEND", "BEFORE_ID", "AFTER_ID", "TARGET_INDEX"],
    fallbackOrder: [],
  };

  return {
    rankingEnabled: true,
    placementModes: ["APPEND", "BEFORE_ID", "AFTER_ID", "TARGET_INDEX"],
    sortRankExposed: true,
    fallbackOrder: [],
    supportedOperations: [
      "capabilities",
      "list",
      "tree",
      "parent-options",
      "get",
      "breadcrumb",
      "create",
      "replace",
      "patch",
      "delete",
      "move",
      "reorder",
      "activate",
      "deactivate",
    ],
    hierarchy: {
      enabled: true,
      readOperations: ["tree", "parent-options", "breadcrumb"],
      mutationOperations: ["move"],
      rootModel: "IMPLICIT_NULL_PARENT",
    },
    limits: {
      pageSize: 1000,
      searchInputLength: 120,
      filterSelections: 4,
      sortSelections: 5,
      treeSize: 10000,
      parentOptionPageSize: 50,
      includeIdCount: 25,
      hierarchyDepth: 2147483647,
    },
    lifecycle: {
      enabled: true,
      states: ["ACTIVE", "INACTIVE"],
      actions: ["activate", "deactivate"],
    },
    identifierProfile: "NUMERIC_LONG_V1",
    fields: [
      "identifier",
      "parent",
      "name",
      "slug",
      "active",
      "created-at",
      "updated-at",
      "rank",
      "hierarchy-context",
    ],
    searchableFields: ["name", "slug"],
    allowedFilters: ["parent", "slug", "active"],
    allowedSorts: [
      "identifier",
      "parent",
      "name",
      "slug",
      "active",
      "created-at",
      "updated-at",
      "rank",
    ],
    ordering,
    ...overrides,
  };
}

export const catalogueCapabilities = createCatalogueCapabilities();
