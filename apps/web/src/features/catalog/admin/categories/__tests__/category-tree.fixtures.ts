import type { AdminCategoryCapabilitiesDto, AdminCategoryDto } from "@tgp/contracts";

import { createCatalogueCapabilities } from "./category-capability.fixtures";

export interface CategoryTreePageFixture {
  data: AdminCategoryDto[];
  page: {
    number: number;
    size: number;
    totalElements: number;
    totalPages: number;
    numberOfElements: number;
    first: boolean;
    last: boolean;
  };
  sort: Array<{
    property: string;
    direction: "asc" | "desc" | "ASC" | "DESC";
  }>;
  links: {
    self: string;
    next: string | null;
    previous: string | null;
  };
}

export const rankedExposedCapabilities: AdminCategoryCapabilitiesDto = createCatalogueCapabilities();

export const rankedHiddenCapabilities: AdminCategoryCapabilitiesDto = createCatalogueCapabilities({
  placementModes: ["APPEND"],
  sortRankExposed: false,
  fallbackOrder: [{ property: "name", direction: "ASC" }],
  ordering: { ...createCatalogueCapabilities().ordering, rankExposed: false, placementModes: ["APPEND"], fallbackOrder: [{ property: "name", direction: "ASC" }] },
});

export const unrankedCapabilities: AdminCategoryCapabilitiesDto = createCatalogueCapabilities({
  rankingEnabled: false,
  placementModes: ["APPEND"],
  sortRankExposed: false,
  fallbackOrder: [{ property: "name", direction: "ASC" }],
  ordering: { ...createCatalogueCapabilities().ordering, rankingEnabled: false, rankExposed: false, placementModes: ["APPEND"], fallbackOrder: [{ property: "name", direction: "ASC" }] },
});

export const appendUnavailableCapabilities: AdminCategoryCapabilitiesDto = createCatalogueCapabilities({
  placementModes: ["TARGET_INDEX"],
  ordering: { ...createCatalogueCapabilities().ordering, placementModes: ["TARGET_INDEX"] },
});

export const smallCategoryTree = [
  categoryTreeItem({
    id: 1,
    hasChildren: true,
    name: "Computers",
    slug: "computers",
    sortRank: 1,
  }),
  categoryTreeItem({
    id: 2,
    parentId: 1,
    name: "Laptops",
    slug: "laptops",
    sortRank: 1,
  }),
  categoryTreeItem({
    active: false,
    id: 3,
    parentId: 1,
    name: "Desktop towers",
    slug: "desktop-towers",
    sortRank: 2,
  }),
  categoryTreeItem({
    id: 4,
    hasChildren: true,
    name: "Accessories",
    slug: "accessories",
    sortRank: 2,
  }),
  categoryTreeItem({
    id: 5,
    parentId: 4,
    name: "Docks",
    slug: "docks",
    sortRank: 1,
  }),
  categoryTreeItem({
    id: 6,
    parentId: 4,
    name: "Chargers",
    slug: "chargers",
    sortRank: 2,
  }),
] satisfies AdminCategoryDto[];

export const rankedHiddenSmallCategoryTree = smallCategoryTree.map((item) => ({
  ...item,
  sortRank: null,
}));

export const unrankedSmallCategoryTree = rankedHiddenSmallCategoryTree;

export const longLabelSmallCategoryTree = [
  categoryTreeItem({
    id: 10,
    hasChildren: true,
    name: "Computers, portable workstations, repair kits, adapters, docks, and regional bundles with a very long localized category label",
    slug: "computers-portable-workstations-repair-kits-adapters-docks-regional-bundles",
    sortRank: 1,
  }),
  categoryTreeItem({
    id: 11,
    parentId: 10,
    name: "USB-C charging accessories with extra long merchant-facing naming",
    slug: "usb-c-charging-accessories-with-extra-long-merchant-facing-naming",
    sortRank: 1,
  }),
] satisfies AdminCategoryDto[];

export const largestSmallTree = createLargestSmallTree();

export function categoryTreePage(
  data: AdminCategoryDto[] = smallCategoryTree,
  overrides: Partial<CategoryTreePageFixture["page"]> = {},
): CategoryTreePageFixture {
  return {
    data,
    page: {
      number: 0,
      size: data.length,
      totalElements: data.length,
      totalPages: data.length > 0 ? 1 : 0,
      numberOfElements: data.length,
      first: true,
      last: true,
      ...overrides,
    },
    sort: [],
    links: {
      self: "/api/v1/admin/category-systems/catalogue/categories/tree?page=0",
      next: null,
      previous: null,
    },
  };
}

export function categoryTreeItem(
  overrides: Partial<AdminCategoryDto> & {
    id: number;
    name: string;
    slug: string;
  },
): AdminCategoryDto {
  const parentId = overrides.parentId ?? null;

  return {
    id: overrides.id,
    parentId,
    sortRank: overrides.sortRank ?? null,
    depth: overrides.depth ?? (parentId == null ? 0 : 1),
    hasChildren: overrides.hasChildren ?? false,
    name: overrides.name,
    slug: overrides.slug,
    active: overrides.active ?? true,
    createdAt: overrides.createdAt ?? "2026-05-29T12:00:00.000Z",
    updatedAt: overrides.updatedAt ?? "2026-05-30T12:00:00.000Z",
  };
}

function createLargestSmallTree(): AdminCategoryDto[] {
  return Array.from({ length: 8 }).flatMap((_, rootIndex) => {
    const rootId = rootIndex * 10 + 100;

    return [
      categoryTreeItem({
        id: rootId,
        hasChildren: true,
        name: `Department ${rootIndex + 1}`,
        slug: `department-${rootIndex + 1}`,
        sortRank: rootIndex + 1,
      }),
      ...Array.from({ length: 5 }).map((__, childIndex) =>
        categoryTreeItem({
          id: rootId + childIndex + 1,
          parentId: rootId,
          depth: 1,
          name: `Department ${rootIndex + 1} category ${childIndex + 1}`,
          slug: `department-${rootIndex + 1}-category-${childIndex + 1}`,
          sortRank: childIndex + 1,
        }),
      ),
    ];
  });
}
