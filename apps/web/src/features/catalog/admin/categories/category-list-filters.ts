import { createCategoryParentScopeFilters } from "./category-listing-scope";
import type {
  CategoryListFilters,
  CategoryListingScope,
  CategoryRefineFilter,
} from "./types/category-admin.types";

export interface CategoryListFilterConstraints {
  readonly allowedFilters?: readonly string[];
  readonly searchableFields?: readonly string[];
  readonly maximumFilters?: number | null;
  readonly maximumSearchLength?: number | null;
}

export type CategoryListFilterValidation =
  | { readonly valid: true }
  | { readonly valid: false; readonly reason: "search-too-long" | "too-many-filters" | "unsupported-filter" };

const SUPPORTED_FILTERS = {
  q: new Set(["contains"]),
  slug: new Set(["eq"]),
  active: new Set(["eq"]),
  parentId: new Set(["eq"]),
} as const;

export const EMPTY_CATEGORY_LIST_FILTERS = {
  q: "",
  slug: "",
  active: "all",
} as const satisfies CategoryListFilters;

export function createCategoryListFilterResetKey(
  filters: CategoryListFilters,
): string {
  return [
    filters.q.trim(),
    filters.slug.trim(),
    filters.active,
  ].join("|");
}

export function createCategoryListRequestFilters(
  filters: CategoryListFilters,
  scope: CategoryListingScope,
  constraints: CategoryListFilterConstraints = {},
): CategoryRefineFilter[] {
  const requestFilters: CategoryRefineFilter[] = [
    ...createCategoryParentScopeFilters(scope),
  ];
  const q = filters.q.trim();
  const slug = filters.slug.trim();

  if (q && isSearchSupported(constraints)) {
    requestFilters.push({ field: "q", operator: "contains", value: q });
  }

  if (slug && isFilterSupported("slug", constraints)) {
    requestFilters.push({ field: "slug", operator: "eq", value: slug });
  }

  if (filters.active !== "all" && isFilterSupported("active", constraints)) {
    requestFilters.push({
      field: "active",
      operator: "eq",
      value: filters.active === "active",
    });
  }

  const validation = validateCategoryListFilters(filters, requestFilters, constraints);
  if (!validation.valid) {
    return [];
  }

  assertSupportedCategoryListFilters(requestFilters);

  return requestFilters;
}

/**
 * Keeps invalid values in local state but makes their request state fail closed.
 * Definition-absent controls are omitted by the caller; this validator never
 * attempts to coerce or truncate a user value.
 */
export function validateCategoryListFilters(
  filters: CategoryListFilters,
  requestFilters: readonly CategoryRefineFilter[],
  constraints: CategoryListFilterConstraints = {},
): CategoryListFilterValidation {
  const maxSearchLength = constraints.maximumSearchLength;
  if (
    typeof maxSearchLength === "number" &&
    filters.q.trim().length > maxSearchLength
  ) {
    return { valid: false, reason: "search-too-long" };
  }

  if (
    typeof constraints.maximumFilters === "number" &&
    requestFilters.length > constraints.maximumFilters
  ) {
    return { valid: false, reason: "too-many-filters" };
  }

  if (
    (filters.q.trim() && !isSearchSupported(constraints)) ||
    (filters.slug.trim() && !isFilterSupported("slug", constraints)) ||
    (filters.active !== "all" && !isFilterSupported("active", constraints))
  ) {
    return { valid: false, reason: "unsupported-filter" };
  }

  return { valid: true };
}

function isSearchSupported(constraints: CategoryListFilterConstraints): boolean {
  return !constraints.searchableFields || constraints.searchableFields.length > 0;
}

function isFilterSupported(
  field: "slug" | "active",
  constraints: CategoryListFilterConstraints,
): boolean {
  if (!constraints.allowedFilters) return true;

  return constraints.allowedFilters.includes(field);
}

export function assertSupportedCategoryListFilters(
  filters: readonly unknown[],
): asserts filters is CategoryRefineFilter[] {
  for (const filter of filters) {
    if (!isPlainObject(filter)) {
      throw new TypeError("Category list filters must be flat filter objects.");
    }

    if ("value" in filter && Array.isArray(filter.value)) {
      throw new TypeError("Category list filters must not use array values.");
    }

    if ("value" in filter && isPlainObject(filter.value)) {
      throw new TypeError("Category list filters must not use object values.");
    }

    const field = filter.field;
    const operator = filter.operator;

    if (
      typeof field !== "string" ||
      typeof operator !== "string" ||
      !(field in SUPPORTED_FILTERS) ||
      !SUPPORTED_FILTERS[field as keyof typeof SUPPORTED_FILTERS].has(
        operator as never,
      )
    ) {
      throw new TypeError("Category list filter is not supported.");
    }
  }
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return (
    Boolean(value) &&
    typeof value === "object" &&
    !Array.isArray(value)
  );
}
