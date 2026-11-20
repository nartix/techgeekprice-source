import type {
  AdminCategoryParentOptionDisabledReason,
  AdminCategoryParentOptionDto,
} from "@tgp/contracts";

export const CATEGORY_PARENT_ROOT_VALUE = "";

export type CategoryParentOptionSource = "root" | "selected" | "remote";

export interface CategoryParentUiOption {
  value: string;
  label: string;
  slug?: string;
  disabled: boolean;
  disabledReason: AdminCategoryParentOptionDisabledReason;
  source: CategoryParentOptionSource;
  dto?: AdminCategoryParentOptionDto;
}

export type CategoryParentOptionsErrorCode =
  | "load-failed"
  | "invalid-response"
  | "cursor-reset-failed"
  | "continuation-conflict"
  | "stale-category"
  | "unauthorized"
  | "forbidden";

export interface CategoryParentOptionsError {
  code: CategoryParentOptionsErrorCode;
  message: string;
  retryable: boolean;
  status?: number;
}

export type CategoryParentSelectedValueStatus =
  | "root"
  | "selectable"
  | "disabled"
  | "missing";

export interface CategoryParentPickerStatus {
  blockingError: CategoryParentOptionsError | null;
  error: CategoryParentOptionsError | null;
  loading: boolean;
  loadingMore: boolean;
  searchError: boolean;
  selectedOption: CategoryParentUiOption | null;
  selectedValueStatus: CategoryParentSelectedValueStatus;
}

export interface CategoryParentPickerMessages {
  clearSelection: string;
  continuationConflict: string;
  cursorResetFailed: string;
  failedToLoad: string;
  forbidden: string;
  inactive: string;
  invalidResponse: string;
  loadMore: string;
  loading: string;
  loadingMore: string;
  noResults: string;
  pickerRecovered: string;
  retry: string;
  rootOption: string;
  searchPlaceholder: string;
  searchTooLong: string;
  selectedInactiveHelp: string;
  staleCategory: string;
  unauthorized: string;
}
