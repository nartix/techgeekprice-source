import {
  CursorHierarchyInvalidResponseError,
  useCursorHierarchyOptions,
  type CursorHierarchyFailure,
} from "@tgp/admin-ui/inputs/hierarchy-picker";
import { useCallback, useMemo } from "react";

import type { AdminFormOptionLoaderApi } from "../../../../platform/admin/forms";
import {
  CATEGORY_PARENT_SEARCH_MAX_LENGTH,
  classifyCategoryParentOptionError,
  isBlockingCategoryParentOptionsError,
  loadCategoryParentOptionSlice,
  toPositiveInteger,
} from "../category-parent-options.api";
import {
  createRootCategoryParentOption,
  getCategoryParentUiOption,
  mapCategoryParentOptionSlice,
  mapCategoryParentUiOption,
} from "../category-parent-options.mapper";
import {
  CATEGORY_PARENT_ROOT_VALUE,
  type CategoryParentOptionsError,
  type CategoryParentPickerStatus,
  type CategoryParentSelectedValueStatus,
  type CategoryParentUiOption,
} from "../types/category-parent-options.types";

interface UseCategoryParentOptionsArgs {
  api: AdminFormOptionLoaderApi;
  apiBasePath?: string;
  excludeSubtreeId?: string | number | null;
  opened: boolean;
  rootLabel: string;
  selectedParentId?: string | number | null;
  value: string;
}

export function useCategoryParentOptions({
  api,
  apiBasePath,
  excludeSubtreeId,
  opened,
  rootLabel,
  selectedParentId,
  value,
}: UseCategoryParentOptionsArgs) {
  const activeSelectedParentId =
    toPositiveInteger(value) ?? toPositiveInteger(selectedParentId);
  const rootOption = useMemo(
    () => createRootCategoryParentOption(rootLabel),
    [rootLabel],
  );
  const selectedIds = useMemo(
    () => (activeSelectedParentId == null ? [] : [String(activeSelectedParentId)]),
    [activeSelectedParentId],
  );
  const contextKey = `${apiBasePath ?? ""}\u0000${excludeSubtreeId ?? ""}`;
  const loader = useCallback(
    async (
      context: { search: string; selectedIds: readonly string[] },
      cursor: string | null,
      signal: AbortSignal,
    ) => {
      try {
        return await loadCategoryParentOptionSlice({
          api,
          apiBasePath,
          cursor,
          excludeSubtreeId,
          q: context.search,
          selectedParentIds: [...context.selectedIds],
          signal,
        });
      } catch (cause) {
        if (
          cursor &&
          classifyCategoryParentOptionError(cause, { cursor, excludeSubtreeId })
            .code === "cursor-reset-failed"
        ) {
          throw new CursorHierarchyInvalidResponseError(cause);
        }

        throw cause;
      }
    },
    [api, apiBasePath, excludeSubtreeId],
  );
  const adaptSlice = useCallback(
    (slice: unknown) => mapCategoryParentOptionSlice(slice, activeSelectedParentId),
    [activeSelectedParentId],
  );
  const validateSearch = useCallback(
    (search: string) => search.length <= CATEGORY_PARENT_SEARCH_MAX_LENGTH,
    [],
  );
  const picker = useCursorHierarchyOptions({
    adaptSlice,
    contextKey,
    enabled: opened || activeSelectedParentId != null,
    loader,
    root: mapCategoryParentUiOption(rootOption),
    selectedIds,
    validateSearch,
  });
  const options = useMemo(() => {
    const currentSelectionIsAuthoritative =
      value === CATEGORY_PARENT_ROOT_VALUE ||
      picker.loading ||
      picker.error !== null ||
      picker.state.remote.some((option) => option.id === value);

    return picker.options
      .map(getCategoryParentUiOption)
      .filter(
        (option) =>
          option.value !== value || currentSelectionIsAuthoritative,
      );
  }, [picker.error, picker.loading, picker.options, picker.state.remote, value]);
  const error = useMemo(
    () => mapPickerFailure(picker.error, { excludeSubtreeId }),
    [excludeSubtreeId, picker.error],
  );
  const selectedParentMissing =
    activeSelectedParentId != null &&
    picker.hasResolvedFirstSlice &&
    !picker.loading &&
    picker.error === null &&
    !picker.state.remote.some(
      (option) => option.id === String(activeSelectedParentId),
    );
  const blockingError =
    error && isBlockingCategoryParentOptionsError(error)
      ? error
      : selectedParentMissing
        ? createPickerError("stale-category", false, null)
        : null;
  const selectedOption =
    options.find((option) => option.value === value) ?? null;
  const selectedValueStatus = getSelectedValueStatus({ options, value });
  const status = useMemo<CategoryParentPickerStatus>(
    () => ({
      blockingError,
      error: blockingError ? null : error,
      loading: picker.loading,
      loadingMore: picker.loadingMore,
      searchError: picker.search.length > CATEGORY_PARENT_SEARCH_MAX_LENGTH,
      selectedOption,
      selectedValueStatus,
    }),
    [
      blockingError,
      error,
      picker.loading,
      picker.loadingMore,
      picker.search.length,
      selectedOption,
      selectedValueStatus,
    ],
  );

  return {
    blockingError,
    clearSearch: () => picker.setSearch(""),
    error: blockingError ? null : error,
    hasMore: picker.state.hasMore,
    loadMore: picker.loadMore,
    loading: picker.loading,
    loadingMore: picker.loadingMore,
    options,
    retry: picker.retry,
    search: picker.search,
    searchError: picker.search.length > CATEGORY_PARENT_SEARCH_MAX_LENGTH,
    selectedOption,
    selectedValueStatus,
    setSearch: picker.setSearch,
    status,
  };
}

function mapPickerFailure(
  failure: CursorHierarchyFailure | null,
  context: { excludeSubtreeId?: string | number | null },
): CategoryParentOptionsError | null {
  if (!failure) {
    return null;
  }

  if (failure.code === "invalid-response") {
    return createPickerError("invalid-response", false, failure.cause);
  }

  if (failure.code === "invalid-continuation") {
    return createPickerError("cursor-reset-failed", false, failure.cause);
  }

  if (failure.code === "continuation-conflict") {
    return createPickerError("continuation-conflict", true, failure.cause);
  }

  return classifyCategoryParentOptionError(failure.cause, context);
}

function createPickerError(
  code: Extract<
    CategoryParentOptionsError["code"],
    | "invalid-response"
    | "cursor-reset-failed"
    | "continuation-conflict"
    | "stale-category"
  >,
  retryable: boolean,
  cause: unknown,
): CategoryParentOptionsError {
  return {
    code,
    message: cause instanceof Error ? cause.message : code,
    retryable,
  };
}

function getSelectedValueStatus(args: {
  options: CategoryParentUiOption[];
  value: string;
}): CategoryParentSelectedValueStatus {
  if (args.value === CATEGORY_PARENT_ROOT_VALUE) {
    return "root";
  }

  const selectedOption = args.options.find(
    (option) => option.value === args.value,
  );

  if (!selectedOption) {
    return "missing";
  }

  return selectedOption.disabled ? "disabled" : "selectable";
}
