"use client";

import { Stack } from "@mantine/core";
import type { SortingState } from "@tanstack/react-table";
import { useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { AdminForbidden } from "../../../../platform/admin/components/AdminForbidden";
import { toLocalizedAdminPath } from "../../../../platform/admin/navigation/adminLocalePaths";
import { getAdminIdentity } from "../../../../platform/admin/session/adminIdentityStore";
import {
  AdminResourceTable,
  useAdminResourceTable,
  useAdminResourceTableViewResult,
  type AdminResourceTableDefaultSort,
  type AdminResourceTableSort,
} from "../../../../platform/admin/table";
import type { AdminIdentity } from "../../../../platform/admin/types/admin.types";
import { canPerformAdminAction } from "../../../../platform/admin/utils/adminPermissions";
import {
  CategorySystemRuntimeProvider,
  useCategorySystemRuntime,
} from "../category-system/CategorySystemRuntimeProvider";
import { catalogueCategorySystemDefinition } from "../category-system/catalogue-category-system.definition";
import { getCategoryOperationAvailability } from "../category-system/category-operation-permissions";
import {
  createCategoryListFilterResetKey,
  createCategoryListRequestFilters,
  EMPTY_CATEGORY_LIST_FILTERS,
  validateCategoryListFilters,
} from "../category-list-filters";
import {
  createCategorySortResetKey,
  isCategoryPlacementModeAvailable,
  resolveCategoryListDefaultSorters,
  resolveCategoryListSorters,
} from "../category-list-sorting";
import { parseCategoryListingScope } from "../category-listing-scope";
import {
  createCategoryTableConfig,
  type AdminCategoryRecord,
} from "../categories-table.config";
import type { CategoryActionGates } from "./CategoryActions";
import {
  createCategoryListingConfig,
  type AdminCategoryListingConfig,
} from "../admin-category-listing.config";
import { CategoryBreadcrumbs } from "./CategoryBreadcrumbs";
import { CategoryFilters } from "./CategoryFilters";
import { CategoryListingContextBar } from "./CategoryListingContextBar";
import { useAdminCategoryBreadcrumb } from "../hooks/useAdminCategoryBreadcrumb";
import type {
  AdminLocale,
  CategoryBreadcrumbState,
  CategoryAdminListItem,
  CategoryAdminPageMetadata,
  CategoryAdminSortField,
  CategoryAdminSortOrder,
  CategoryCapabilitiesState,
  CategoryListFilters,
  CategoryListingScope,
} from "../types/category-admin.types";

interface CategoryListViewProps {
  config: AdminCategoryListingConfig;
  identity: AdminIdentity | null;
  locale: AdminLocale;
  items: CategoryAdminListItem[];
  currentPage: number;
  pageSize: number;
  sortField: CategoryAdminSortField;
  sortOrder: CategoryAdminSortOrder;
  breadcrumbState?: CategoryBreadcrumbState;
  capabilitiesState?: CategoryCapabilitiesState;
  filters?: CategoryListFilters;
  page?: CategoryAdminPageMetadata;
  scope?: CategoryListingScope;
  loading?: boolean;
  fetching?: boolean;
  error?: boolean;
  forbidden?: boolean;
  connectedActions?: boolean;
  moveActionsAvailable?: boolean;
  stateActionsAvailable?: boolean;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  onRetry?: () => void;
  onFiltersChange?: (filters: CategoryListFilters) => void;
  onSortChange?: (
    field: CategoryAdminSortField,
    order: CategoryAdminSortOrder,
  ) => void;
}

interface AdminCategoryListContentProps {
  config: AdminCategoryListingConfig;
  identity: AdminIdentity | null;
  locale: AdminLocale;
}

export function ProductCategoryList({ locale }: { locale: AdminLocale }) {
  return (
    <AdminCategoryList
      config={createCategoryListingConfig(
        catalogueCategorySystemDefinition,
        "product-categories",
      )}
      locale={locale}
    />
  );
}

export function AdminCategoryList({
  config,
  locale,
  runtimeProvided = false,
}: {
  config: AdminCategoryListingConfig;
  locale: AdminLocale;
  runtimeProvided?: boolean;
}) {
  const identity = getAdminIdentity();
  const tStates = useTranslations("Admin.States");

  if (!canPerformAdminAction(identity, config.permissionResource, "list")) {
    return (
      <AdminForbidden
        title={tStates("forbiddenTitle")}
        message={tStates("forbiddenMessage")}
      />
    );
  }

  const content = (
    <AdminCategoryListContent
      config={config}
      identity={identity}
      locale={locale}
    />
  );

  return runtimeProvided ? (
    content
  ) : (
    <CategorySystemRuntimeProvider
      definition={catalogueCategorySystemDefinition}
      identityPermissions={identity?.permissions}
    >
      {content}
    </CategorySystemRuntimeProvider>
  );
}

function AdminCategoryListContent({
  config,
  identity,
  locale,
}: AdminCategoryListContentProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const scopeResult = useMemo(
    () => parseCategoryListingScope(searchParams, config.listHref),
    [config.listHref, searchParams],
  );
  const { scope } = scopeResult;
  const {
    capabilityState: capabilitiesState,
    definition,
    permissions,
  } = useCategorySystemRuntime();
  const listAvailability = getCategoryOperationAvailability({
    definition,
    capabilityState: capabilitiesState,
    identityPermissions: [...permissions],
    operation: "list",
    visible: true,
    screen: "list",
    requireIdentifierProfile: "NUMERIC_LONG_V1",
  });
  const breadcrumbAvailability = getCategoryOperationAvailability({
    definition,
    capabilityState: capabilitiesState,
    identityPermissions: [...permissions],
    operation: "breadcrumb",
    requireHierarchyRead: "breadcrumb",
    requireIdentifierProfile: "NUMERIC_LONG_V1",
    screen: "list",
  });
  const hierarchyNavigationAvailability = getCategoryOperationAvailability({
    definition,
    capabilityState: capabilitiesState,
    identityPermissions: [...permissions],
    operation: "tree",
    requireHierarchyRead: "tree",
    requireIdentifierProfile: "NUMERIC_LONG_V1",
    screen: "tree",
  });
  const moveAvailability = getCategoryOperationAvailability({
    definition,
    capabilityState: capabilitiesState,
    identityPermissions: [...permissions],
    operation: "move",
    requireHierarchyMutation: "move",
    requireIdentifierProfile: "NUMERIC_LONG_V1",
    visible: true,
  });
  const activateAvailability = getCategoryOperationAvailability({
    definition,
    capabilityState: capabilitiesState,
    identityPermissions: [...permissions],
    operation: "activate",
    requireLifecycleAction: "activate",
    visible: true,
  });
  const deactivateAvailability = getCategoryOperationAvailability({
    definition,
    capabilityState: capabilitiesState,
    identityPermissions: [...permissions],
    operation: "deactivate",
    requireLifecycleAction: "deactivate",
    visible: true,
  });
  const breadcrumbState = useAdminCategoryBreadcrumb(
    scope.mode === "children" ? scope.parentId : null,
    {
      apiBasePath: config.apiBasePath,
      enabled: breadcrumbAvailability.usable,
    },
  );
  const [filters, setFilters] = useState<CategoryListFilters>(
    EMPTY_CATEGORY_LIST_FILTERS,
  );
  const filterConstraints = useMemo(
    () =>
      capabilitiesState.status === "ready"
        ? {
            allowedFilters: capabilitiesState.capabilities.allowedFilters,
            maximumFilters:
              capabilitiesState.capabilities.limits.filterSelections,
            maximumSearchLength:
              capabilitiesState.capabilities.limits.searchInputLength,
            searchableFields: capabilitiesState.capabilities.searchableFields,
          }
        : {},
    [capabilitiesState],
  );
  const candidateFilters = useMemo(
    () => createCategoryListRequestFilters(filters, scope),
    [filters, scope],
  );
  const filterValidation = useMemo(
    () =>
      validateCategoryListFilters(filters, candidateFilters, filterConstraints),
    [candidateFilters, filterConstraints, filters],
  );
  const defaultSort = useMemo(
    () => resolveCategoryListDefaultSorters(scope, capabilitiesState),
    [capabilitiesState, scope],
  );
  const resetKey = [
    scope.resetKey,
    createCategoryListFilterResetKey(filters),
    createCategorySortResetKey(scope, capabilitiesState),
  ].join("::");
  const externalFilters = useMemo(
    () =>
      filterValidation.valid
        ? createCategoryListRequestFilters(filters, scope, filterConstraints)
        : [],
    [filterConstraints, filterValidation.valid, filters, scope],
  );
  const resolveSorters = useCallback(
    ({
      defaultSort: resolvedDefaultSort,
      sorting,
    }: {
      defaultSort: AdminResourceTableSort[];
      sorting: SortingState;
    }) =>
      resolveCategoryListSorters({
        scope,
        capabilitiesState,
        requestedSorters:
          sorting.length > 0
            ? sorting.map((sort) => ({
                field: sort.id,
                order: sort.desc ? "desc" : "asc",
              }))
            : resolvedDefaultSort,
      }),
    [capabilitiesState, scope],
  );

  useEffect(() => {
    if (!scopeResult.invalid) {
      return;
    }

    router.replace(toLocalizedAdminPath(locale, scope.canonicalHref));
  }, [locale, router, scope.canonicalHref, scopeResult.invalid]);

  const tableConfig = useCategoryTableConfig({
    actionGates: (record) =>
      createCategoryActionGates({
        capabilityState: capabilitiesState,
        definition,
        permissions: [...permissions],
        record,
      }),
    categoryConfig: config,
    childNavigationAvailable: hierarchyNavigationAvailability.usable,
    connectedActions: true,
    defaultSort,
    identity,
    locale,
    moveActionsAvailable:
      moveAvailability.usable &&
      isCategoryPlacementModeAvailable(capabilitiesState, "APPEND"),
    scope,
    stateActionsAvailable:
      activateAvailability.usable || deactivateAvailability.usable,
  });
  const result = useAdminResourceTable<
    AdminCategoryRecord,
    CategoryAdminListItem
  >({
    config: tableConfig,
    externalFilters,
    identity,
    locale,
    queryEnabled: listAvailability.usable && filterValidation.valid,
    resetKey,
    resolveSorters,
  });

  return (
    <Stack gap="md">
      <CategoryListingContextBar
        capabilitiesState={capabilitiesState}
        listHref={config.listHref}
        locale={locale}
        rootScopeAvailable={hierarchyNavigationAvailability.usable}
        scope={scope}
        treeHref={config.treeHref}
        treeAvailable={hierarchyNavigationAvailability.usable}
      />
      <CategoryBreadcrumbs
        listHref={config.listHref}
        locale={locale}
        scope={scope}
        state={breadcrumbState}
      />
      <CategoryFilters
        activeVisible={
          capabilitiesState.status !== "ready" ||
          capabilitiesState.capabilities.allowedFilters.includes("active")
        }
        disabled={result.isLoading || !listAvailability.usable}
        filters={filters}
        qVisible={
          capabilitiesState.status !== "ready" ||
          capabilitiesState.capabilities.searchableFields.length > 0
        }
        onChange={setFilters}
        slugVisible={
          capabilitiesState.status !== "ready" ||
          capabilitiesState.capabilities.allowedFilters.includes("slug")
        }
        validation={filterValidation}
      />
      <AdminResourceTable result={result} />
    </Stack>
  );
}

export function CategoryListView({
  config,
  identity,
  locale,
  items,
  currentPage,
  pageSize,
  sortField,
  sortOrder,
  breadcrumbState = { status: "idle" },
  capabilitiesState = {
    status: "ready",
    capabilities: {
      rankingEnabled: false,
      placementModes: [],
      sortRankExposed: false,
      fallbackOrder: [{ property: "updatedAt", direction: "DESC" }],
      supportedOperations: [],
      hierarchy: {
        enabled: false,
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
      lifecycle: { enabled: false, states: [], actions: [] },
      identifierProfile: "NUMERIC_LONG_V1",
      fields: [],
      searchableFields: [],
      allowedFilters: [],
      allowedSorts: [],
      ordering: {
        orderingEnabled: false,
        rankingEnabled: false,
        rankExposed: false,
        reorderSupported: false,
        placementModes: [],
        fallbackOrder: [{ property: "updatedAt", direction: "DESC" }],
      },
    },
  },
  filters = EMPTY_CATEGORY_LIST_FILTERS,
  page,
  scope,
  loading = false,
  fetching = false,
  error = false,
  forbidden = false,
  connectedActions = false,
  moveActionsAvailable = false,
  stateActionsAvailable = true,
  onPageChange,
  onPageSizeChange,
  onRetry,
  onFiltersChange,
  onSortChange,
}: CategoryListViewProps) {
  const resolvedScope =
    scope ??
    parseCategoryListingScope(new URLSearchParams(), config.listHref).scope;
  const defaultSort = useMemo(
    () => resolveCategoryListDefaultSorters(resolvedScope, capabilitiesState),
    [capabilitiesState, resolvedScope],
  );
  const tableConfig = useCategoryTableConfig({
    categoryConfig: config,
    connectedActions,
    defaultSort,
    identity,
    locale,
    moveActionsAvailable,
    scope: resolvedScope,
    stateActionsAvailable,
  });
  const result = useAdminResourceTableViewResult<
    AdminCategoryRecord,
    CategoryAdminListItem
  >({
    config: tableConfig,
    identity,
    locale,
    rows: items,
    currentPage,
    pageSize,
    sortField,
    sortOrder,
    page,
    loading,
    fetching,
    error,
    forbidden,
    onPageChange,
    onPageSizeChange,
    onRetry,
    onSortChange: (field, order) =>
      onSortChange?.(field as CategoryAdminSortField, order),
  });

  return (
    <Stack gap="md">
      <CategoryListingContextBar
        capabilitiesState={capabilitiesState}
        listHref={config.listHref}
        locale={locale}
        scope={resolvedScope}
        treeHref={config.treeHref}
      />
      <CategoryBreadcrumbs
        listHref={config.listHref}
        locale={locale}
        scope={resolvedScope}
        state={breadcrumbState}
      />
      <CategoryFilters
        disabled={loading}
        filters={filters}
        onChange={(nextFilters) => onFiltersChange?.(nextFilters)}
      />
      <AdminResourceTable result={result} />
    </Stack>
  );
}

function useCategoryTableConfig({
  actionGates,
  categoryConfig,
  childNavigationAvailable,
  connectedActions,
  defaultSort,
  identity,
  locale,
  moveActionsAvailable,
  scope,
  stateActionsAvailable,
}: {
  actionGates?: (record: CategoryAdminListItem) => CategoryActionGates;
  categoryConfig: AdminCategoryListingConfig;
  childNavigationAvailable?: boolean;
  connectedActions: boolean;
  defaultSort: AdminResourceTableDefaultSort;
  identity: AdminIdentity | null;
  locale: AdminLocale;
  moveActionsAvailable: boolean;
  scope: CategoryListingScope;
  stateActionsAvailable: boolean;
}) {
  const t = useTranslations("Admin.ProductCategories");
  const tStates = useTranslations("Admin.States");
  const tTableStatus = useTranslations("Admin.Table.status");
  const tTableHydration = useTranslations("Admin.Table.hydration");

  return useMemo(
    () =>
      createCategoryTableConfig({
        actionGates,
        childNavigationAvailable,
        connectedActions,
        config: categoryConfig,
        defaultSort,
        identity,
        locale,
        moveActionsAvailable,
        scope,
        stateActionsAvailable,
        t,
        tStates,
        tTableHydration,
        tTableStatus,
      }),
    [
      actionGates,
      categoryConfig,
      childNavigationAvailable,
      connectedActions,
      defaultSort,
      identity,
      locale,
      moveActionsAvailable,
      scope,
      stateActionsAvailable,
      t,
      tStates,
      tTableHydration,
      tTableStatus,
    ],
  );
}

function createCategoryActionGates({
  capabilityState,
  definition,
  permissions,
  record,
}: {
  capabilityState: ReturnType<
    typeof useCategorySystemRuntime
  >["capabilityState"];
  definition: ReturnType<typeof useCategorySystemRuntime>["definition"];
  permissions: readonly string[];
  record: CategoryAdminListItem;
}): CategoryActionGates {
  const operation = (
    name: Parameters<typeof getCategoryOperationAvailability>[0]["operation"],
    options: Omit<
      Parameters<typeof getCategoryOperationAvailability>[0],
      "definition" | "capabilityState" | "identityPermissions" | "operation"
    > = {},
  ) =>
    toCategoryActionGate(
      getCategoryOperationAvailability({
        definition,
        capabilityState,
        identityPermissions: permissions,
        operation: name,
        requireIdentifierProfile: "NUMERIC_LONG_V1",
        ...options,
      }),
    );

  return {
    view: operation("get", { screen: "detail" }),
    edit: combineCategoryActionGates(
      operation("get", { screen: "edit" }),
      operation("patch", { screen: "edit" }),
    ),
    delete: operation("delete", { visible: true }),
    move: operation("move", {
      visible: true,
      requireHierarchyMutation: "move",
    }),
    activate: operation("activate", {
      visible: true,
      requireLifecycleAction: "activate",
      recordState: record.active ? "ACTIVE" : "INACTIVE",
    }),
    deactivate: operation("deactivate", {
      visible: true,
      requireLifecycleAction: "deactivate",
      recordState: record.active ? "ACTIVE" : "INACTIVE",
    }),
  };
}

function toCategoryActionGate(
  availability: ReturnType<typeof getCategoryOperationAvailability>,
): CategoryActionGates["delete"] {
  if (availability.usable) return { visible: true };

  return availability.reason === "not-ready" ||
    availability.reason === "identity-mismatch"
    ? { visible: true, disabled: true }
    : { visible: false };
}

function combineCategoryActionGates(
  ...gates: Array<CategoryActionGates["edit"]>
): CategoryActionGates["edit"] {
  if (gates.every((gate) => gate?.visible && !gate.disabled))
    return { visible: true };
  if (gates.some((gate) => gate?.visible && gate.disabled))
    return { visible: true, disabled: true };
  return { visible: false };
}
