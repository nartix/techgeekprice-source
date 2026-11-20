import type { AdminResourceTableSort } from "../../../platform/admin/table";
import type {
  CategoryAdminSortField,
  CategoryCapabilitiesState,
  CategoryListingScope,
} from "./types/category-admin.types";

const CATEGORY_SORT_FIELDS = new Set<CategoryAdminSortField>([
  "id",
  "parentId",
  "slug",
  "name",
  "sortRank",
  "active",
  "createdAt",
  "updatedAt",
]);

const ALL_MODE_DEFAULT_SORT = [
  { field: "updatedAt", order: "desc" },
] as const satisfies AdminResourceTableSort[];

const RANKED_SIBLING_DEFAULT_SORT = [
  { field: "sortRank", order: "asc" },
  { field: "id", order: "asc" },
] as const satisfies AdminResourceTableSort[];

const LOGICAL_TO_PUBLIC_SORT_FIELD = {
  identifier: "id",
  parent: "parentId",
  name: "name",
  slug: "slug",
  active: "active",
  "created-at": "createdAt",
  "updated-at": "updatedAt",
  rank: "sortRank",
} as const satisfies Record<string, CategoryAdminSortField>;

export function resolveCategoryListDefaultSorters(
  scope: CategoryListingScope,
  capabilitiesState: CategoryCapabilitiesState,
): AdminResourceTableSort[] {
  const allowed = getAllowedSortFields(capabilitiesState);
  const maximum = getMaximumSortSelections(capabilitiesState);

  if (scope.mode === "all") {
    return chooseSafeDefault(
      ALL_MODE_DEFAULT_SORT,
      capabilitiesState,
      allowed,
      maximum,
    );
  }

  if (capabilitiesState.status !== "ready") {
    return [];
  }

  const { capabilities } = capabilitiesState;

  if (
    capabilities.rankingEnabled &&
    capabilities.sortRankExposed &&
    maximum >= RANKED_SIBLING_DEFAULT_SORT.length &&
    allowed.has("sortRank") &&
    allowed.has("id")
  ) {
    return [...RANKED_SIBLING_DEFAULT_SORT];
  }

  const fallback = sanitizeCategorySorters(
    capabilities.fallbackOrder.flatMap((sort) => {
      const order = normalizeSortDirection(sort.direction);

      return order ? [{ field: sort.property, order }] : [];
    }),
    { allowSortRank: false, allowed, maximum },
  );

  return fallback.length > 0
    ? fallback
    : chooseSafeDefault([], capabilitiesState, allowed, maximum);
}

export function resolveCategoryListSorters(args: {
  scope: CategoryListingScope;
  capabilitiesState: CategoryCapabilitiesState;
  requestedSorters: AdminResourceTableSort[];
}): AdminResourceTableSort[] {
  const defaultSorters = resolveCategoryListDefaultSorters(
    args.scope,
    args.capabilitiesState,
  );

  if (args.requestedSorters.length === 0) {
    return defaultSorters;
  }

  const rankAvailable =
    args.scope.mode !== "all" &&
    args.capabilitiesState.status === "ready" &&
    args.capabilitiesState.capabilities.rankingEnabled &&
    args.capabilitiesState.capabilities.sortRankExposed;

  return sanitizeCategorySorters(args.requestedSorters, {
    allowSortRank: rankAvailable,
    allowed: getAllowedSortFields(args.capabilitiesState),
    maximum: getMaximumSortSelections(args.capabilitiesState),
  });
}

export function createCategorySortResetKey(
  scope: CategoryListingScope,
  capabilitiesState: CategoryCapabilitiesState,
): string {
  if (scope.mode === "all") {
    return "all:updatedAt-desc";
  }

  if (capabilitiesState.status !== "ready") {
    return `${scope.resetKey}:${capabilitiesState.status}`;
  }

  return `${scope.resetKey}:${resolveCategoryListDefaultSorters(
    scope,
    capabilitiesState,
  )
    .map((sort) => `${sort.field}-${sort.order}`)
    .join(",")}`;
}

export function isCategoryPlacementModeAvailable(
  capabilitiesState: CategoryCapabilitiesState,
  placementMode: "APPEND" | "BEFORE_ID" | "AFTER_ID" | "TARGET_INDEX",
): boolean {
  return (
    capabilitiesState.status === "ready" &&
    capabilitiesState.capabilities.rankingEnabled &&
    capabilitiesState.capabilities.sortRankExposed &&
    capabilitiesState.capabilities.placementModes.includes(placementMode)
  );
}

function sanitizeCategorySorters(
  sorters: AdminResourceTableSort[],
  options: {
    allowSortRank: boolean;
    allowed: ReadonlySet<string>;
    maximum: number;
  },
): AdminResourceTableSort[] {
  return sorters.flatMap((sort) => {
    const order = normalizeSortDirection(sort.order);

    if (
      !order ||
      !CATEGORY_SORT_FIELDS.has(sort.field as CategoryAdminSortField) ||
      !options.allowed.has(sort.field)
    ) {
      return [];
    }

    if (sort.field === "sortRank" && (!options.allowSortRank || order === "desc")) {
      return [];
    }

    return [{ field: sort.field, order }];
  }).slice(0, options.maximum);
}

function getAllowedSortFields(
  capabilitiesState: CategoryCapabilitiesState,
): ReadonlySet<string> {
  if (capabilitiesState.status !== "ready") return new Set();

  return new Set(
    capabilitiesState.capabilities.allowedSorts.flatMap((field) => {
      const publicField = LOGICAL_TO_PUBLIC_SORT_FIELD[
        field as keyof typeof LOGICAL_TO_PUBLIC_SORT_FIELD
      ];
      return publicField ? [publicField] : [];
    }),
  );
}

function getMaximumSortSelections(
  capabilitiesState: CategoryCapabilitiesState,
): number {
  if (capabilitiesState.status !== "ready") return 0;

  return capabilitiesState.capabilities.limits.sortSelections ?? Number.MAX_SAFE_INTEGER;
}

function chooseSafeDefault(
  preferred: readonly AdminResourceTableSort[],
  capabilitiesState: CategoryCapabilitiesState,
  allowed: ReadonlySet<string>,
  maximum: number,
): AdminResourceTableSort[] {
  const preferredSafe = sanitizeCategorySorters([...preferred], {
    allowSortRank: false,
    allowed,
    maximum,
  });
  if (preferredSafe.length > 0) return preferredSafe;

  const canonicalFallback = capabilitiesState.status === "ready"
    ? sanitizeCategorySorters(
        capabilitiesState.capabilities.fallbackOrder.flatMap((sort) => {
          const order = normalizeSortDirection(sort.direction);
          return order ? [{ field: sort.property, order }] : [];
        }),
        { allowSortRank: false, allowed, maximum },
      )
    : [];
  if (canonicalFallback.length > 0) return canonicalFallback;

  if (maximum > 0 && allowed.has("id")) {
    return [{ field: "id", order: "asc" }];
  }

  const first = [...allowed][0];
  return first && maximum > 0 ? [{ field: first, order: "asc" }] : [];
}

function normalizeSortDirection(
  direction: string,
): AdminResourceTableSort["order"] | null {
  const normalized = direction.toLowerCase();

  return normalized === "asc" || normalized === "desc" ? normalized : null;
}
