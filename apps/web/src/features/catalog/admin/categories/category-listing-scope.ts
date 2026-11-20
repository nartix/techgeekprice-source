import type {
  CategoryListingScope,
  CategoryListingScopeResult,
  CategoryRefineFilter,
} from "./types/category-admin.types";

export function parseCategoryListingScope(
  searchParams: Pick<URLSearchParams, "getAll">,
  listHref: string,
): CategoryListingScopeResult {
  const parentIds = searchParams.getAll("parentId");
  const allScope = createAllCategoryScope(listHref);

  if (parentIds.length === 0) {
    return { scope: allScope, invalid: false };
  }

  if (parentIds.length !== 1) {
    return { scope: allScope, invalid: true };
  }

  const [rawParentId] = parentIds;

  if (!rawParentId || !isCanonicalSafeInteger(rawParentId)) {
    return { scope: allScope, invalid: true };
  }

  const parentId = Number(rawParentId);

  if (parentId === 0) {
    return { scope: createRootCategoryScope(listHref), invalid: false };
  }

  if (parentId > 0) {
    return {
      scope: createChildCategoryScope(parentId, listHref),
      invalid: false,
    };
  }

  return { scope: allScope, invalid: true };
}

export function createCategoryScopeHref(
  parentId: number | undefined,
  listHref: string,
): string {
  if (parentId === undefined) {
    return createAllCategoryScope(listHref).canonicalHref;
  }

  return parentId === 0
    ? createRootCategoryScope(listHref).canonicalHref
    : createChildCategoryScope(parentId, listHref).canonicalHref;
}

export function createCategoryScopeResetKey(scope: CategoryListingScope): string {
  return scope.resetKey;
}

export function createCategoryParentScopeFilters(
  scope: CategoryListingScope,
): CategoryRefineFilter[] {
  if (scope.mode === "all") {
    return [];
  }

  return [
    {
      field: "parentId",
      operator: "eq",
      value: scope.parentId,
    },
  ];
}

function createAllCategoryScope(listHref: string): CategoryListingScope {
  return {
    mode: "all",
    canonicalHref: listHref,
    resetKey: "all",
  };
}

function createRootCategoryScope(listHref: string): CategoryListingScope {
  return {
    mode: "root",
    parentId: 0,
    canonicalHref: `${listHref}?parentId=0`,
    resetKey: "root:0",
  };
}

function createChildCategoryScope(
  parentId: number,
  listHref: string,
): CategoryListingScope {
  if (!Number.isSafeInteger(parentId) || parentId <= 0) {
    throw new TypeError("Category parent scope must be a positive safe integer.");
  }

  return {
    mode: "children",
    parentId,
    canonicalHref: `${listHref}?parentId=${parentId}`,
    resetKey: `children:${parentId}`,
  };
}

function isCanonicalSafeInteger(value: string): boolean {
  if (!/^(0|[1-9]\d*)$/.test(value)) {
    return false;
  }

  return Number.isSafeInteger(Number(value));
}
