import type { AdminDetailState } from "../types/admin-detail.types";

interface SelectAdminDetailStateOptions {
  canRead: boolean;
  error: unknown;
  hasRecord: boolean;
  isEmptyContent?: boolean;
  isInvalidRouteId: boolean;
  isLoading: boolean;
  isNotFound: boolean;
}

export function selectAdminDetailState({
  canRead,
  error,
  hasRecord,
  isEmptyContent = false,
  isInvalidRouteId,
  isLoading,
  isNotFound,
}: SelectAdminDetailStateOptions): AdminDetailState {
  if (!canRead) {
    return "forbidden";
  }

  if (isInvalidRouteId) {
    return "invalid";
  }

  if (isLoading && !hasRecord) {
    return "loading";
  }

  if (isNotFound) {
    return "not-found";
  }

  if (error && !hasRecord) {
    return "error";
  }

  if (hasRecord && isEmptyContent) {
    return "empty";
  }

  return hasRecord ? "ready" : "error";
}
