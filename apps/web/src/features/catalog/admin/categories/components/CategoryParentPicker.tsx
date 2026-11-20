"use client";

import { CursorHierarchyPicker } from "@tgp/admin-ui/inputs/hierarchy-picker";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useRef, useState } from "react";

import type { AdminFormOptionLoaderApi } from "../../../../platform/admin/forms";
import { mapCategoryParentUiOption } from "../category-parent-options.mapper";
import { useCategoryParentOptions } from "../hooks/useCategoryParentOptions";
import {
  type CategoryParentOptionsError,
  type CategoryParentPickerMessages,
  type CategoryParentPickerStatus,
} from "../types/category-parent-options.types";
import { CategoryParentOptionRow } from "./CategoryParentOptionRow";

interface CategoryParentPickerProps {
  api: AdminFormOptionLoaderApi;
  apiBasePath?: string;
  value: string;
  onChange(value: string): void;
  label: string;
  description?: string;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  selectedParentId?: string | number | null;
  excludeSubtreeId?: string | number | null;
  onStatusChange?: (status: CategoryParentPickerStatus) => void;
}

export function CategoryParentPicker({
  api,
  apiBasePath,
  description,
  disabled = false,
  error,
  excludeSubtreeId,
  label,
  onChange,
  onStatusChange,
  required = false,
  selectedParentId,
  value,
}: CategoryParentPickerProps) {
  const [opened, setOpened] = useState(false);
  const t = useTranslations("Admin.ProductCategories.parentPicker");
  const messages = useMemo<CategoryParentPickerMessages>(
    () => ({
      clearSelection: t("clearSelection"),
      continuationConflict: t("continuationConflict"),
      cursorResetFailed: t("cursorResetFailed"),
      failedToLoad: t("failedToLoad"),
      forbidden: t("forbidden"),
      inactive: t("inactive"),
      invalidResponse: t("invalidResponse"),
      loadMore: t("loadMore"),
      loading: t("loading"),
      loadingMore: t("loadingMore"),
      noResults: t("noResults"),
      pickerRecovered: t("pickerRecovered"),
      retry: t("retry"),
      rootOption: t("rootOption"),
      searchPlaceholder: t("searchPlaceholder"),
      searchTooLong: t("searchTooLong"),
      selectedInactiveHelp: t("selectedInactiveHelp"),
      staleCategory: t("staleCategory"),
      unauthorized: t("unauthorized"),
    }),
    [t],
  );
  const picker = useCategoryParentOptions({
    api,
    apiBasePath,
    excludeSubtreeId,
    opened,
    rootLabel: messages.rootOption,
    selectedParentId,
    value,
  });
  const displayedError = picker.blockingError ?? picker.error;
  const statusKey = [
    picker.status.blockingError?.code ?? "",
    picker.status.error?.code ?? "",
    picker.status.loading,
    picker.status.loadingMore,
    picker.status.searchError,
    picker.status.selectedOption?.value ?? "",
    picker.status.selectedValueStatus,
  ].join("\u0000");
  const lastReportedStatusKey = useRef<string | null>(null);

  useEffect(() => {
    if (lastReportedStatusKey.current === statusKey) {
      return;
    }

    lastReportedStatusKey.current = statusKey;
    onStatusChange?.(picker.status);
  }, [onStatusChange, picker.status, statusKey]);

  return (
    <CursorHierarchyPicker
      description={description}
      disabled={disabled || picker.blockingError !== null}
      emptyLabel={messages.noResults}
      emptyWhen={!picker.loading && picker.options.length === 0}
      error={
        error ??
        (picker.searchError ? messages.searchTooLong : undefined)
      }
      errorMessage={
        displayedError
          ? getCategoryParentErrorMessage(displayedError, messages)
          : undefined
      }
      hasMore={!picker.blockingError && picker.hasMore}
      label={label}
      loadMoreLabel={
        picker.loadingMore ? messages.loadingMore : messages.loadMore
      }
      loading={picker.loading}
      loadingLabel={messages.loading}
      loadingMore={picker.loadingMore}
      options={picker.options.map(mapCategoryParentUiOption)}
      opened={opened}
      placeholder={messages.searchPlaceholder}
      renderOption={(option) => (
        <CategoryParentOptionRow
          messages={messages}
          option={picker.options.find((item) => item.value === option.id) ?? {
            disabled: Boolean(option.disabled),
            disabledReason: null,
            label: option.label,
            source: option.source,
            value: option.id,
          }}
        />
      )}
      required={required}
      retryLabel={messages.retry}
      value={value}
      onChange={onChange}
      onLoadMore={picker.loadMore}
      onOpenChange={setOpened}
      onRetry={displayedError?.retryable ? picker.retry : undefined}
      onSearchChange={picker.setSearch}
    />
  );
}

function getCategoryParentErrorMessage(
  error: CategoryParentOptionsError,
  messages: CategoryParentPickerMessages,
): string {
  switch (error.code) {
    case "invalid-response":
      return messages.invalidResponse;
    case "cursor-reset-failed":
      return messages.cursorResetFailed;
    case "continuation-conflict":
      return messages.continuationConflict;
    case "stale-category":
      return messages.staleCategory;
    case "unauthorized":
      return messages.unauthorized;
    case "forbidden":
      return messages.forbidden;
    case "load-failed":
      return messages.failedToLoad;
  }
}
