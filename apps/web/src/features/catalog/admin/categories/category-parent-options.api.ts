import type { AdminCategoryParentOptionSliceDto } from "@tgp/contracts";
import { extractAdminCategoryBackendErrorCode } from "@tgp/api-client";

import type { AdminFormOptionLoaderApi } from "../../../platform/admin/forms";
import type {
  CategoryParentOptionsError,
  CategoryParentOptionsErrorCode,
} from "./types/category-parent-options.types";

export const CATEGORY_PARENT_OPTION_LIMIT = 25;
export const CATEGORY_PARENT_SEARCH_MAX_LENGTH = 120;
export const CATEGORY_PARENT_OPTIONS_URL =
  "/api/v1/admin/category-systems/catalogue/categories/parent-options";
const DEFAULT_CATEGORY_API_BASE_PATH =
  "/api/v1/admin/category-systems/catalogue/categories";

export interface LoadCategoryParentOptionSliceArgs {
  api: AdminFormOptionLoaderApi;
  apiBasePath?: string;
  q?: string;
  cursor?: string | null;
  selectedParentId?: string | number | null;
  selectedParentIds?: Array<string | number | null | undefined>;
  excludeSubtreeId?: string | number | null;
  maximum?: number | null;
  signal?: AbortSignal;
}

export async function loadCategoryParentOptionSlice({
  api,
  apiBasePath,
  cursor,
  excludeSubtreeId,
  q,
  selectedParentId,
  selectedParentIds,
  signal,
  maximum,
}: LoadCategoryParentOptionSliceArgs): Promise<AdminCategoryParentOptionSliceDto> {
  return api.custom<AdminCategoryParentOptionSliceDto>({
    method: "get",
    query: createCategoryParentOptionQuery({
      cursor,
      excludeSubtreeId,
      q,
      selectedParentId,
      selectedParentIds,
      maximum,
    }),
    signal,
    url: createCategoryParentOptionsUrl(apiBasePath),
  });
}

export function createCategoryParentOptionQuery(args: {
  q?: string;
  cursor?: string | null;
  selectedParentId?: string | number | null;
  selectedParentIds?: Array<string | number | null | undefined>;
  excludeSubtreeId?: string | number | null;
  maximum?: number | null;
}): Record<string, unknown> {
  const selectedParentIds = getSelectedParentIds(args);
  const excludeSubtreeId = toPositiveInteger(args.excludeSubtreeId);
  const query: Record<string, unknown> = {
    limit: getCategoryParentOptionLimit(args.maximum),
  };
  const normalizedSearch = args.q?.trim() ?? "";
  const cursor = args.cursor?.trim() ?? "";

  if (normalizedSearch.length > 0) {
    query.q = normalizedSearch;
  }

  if (cursor.length > 0) {
    query.cursor = cursor;
  }

  if (selectedParentIds.length > 0) {
    query.includeIds = selectedParentIds;
    query.includeInactive = true;
  }

  if (excludeSubtreeId != null) {
    query.excludeSubtreeId = excludeSubtreeId;
  }

  return query;
}

function createCategoryParentOptionsUrl(apiBasePath?: string): string {
  const basePath = (apiBasePath ?? DEFAULT_CATEGORY_API_BASE_PATH).replace(
    /\/+$/,
    "",
  );

  return `${basePath}/parent-options`;
}

function getSelectedParentIds(args: {
  selectedParentId?: string | number | null;
  selectedParentIds?: Array<string | number | null | undefined>;
}): number[] {
  const values = [
    ...(args.selectedParentIds ?? []),
    args.selectedParentId,
  ];
  const ids: number[] = [];
  const seen = new Set<number>();

  for (const value of values) {
    const id = toPositiveInteger(value);

    if (id == null || seen.has(id)) {
      continue;
    }

    seen.add(id);
    ids.push(id);
  }

  return ids;
}

export function classifyCategoryParentOptionError(
  error: unknown,
  context: { cursor?: string | null; excludeSubtreeId?: string | number | null },
): CategoryParentOptionsError {
  const status = getErrorStatus(error);
  const backendCode = extractAdminCategoryBackendErrorCode(error);
  const excludeSubtreeId = toPositiveInteger(context.excludeSubtreeId);
  const cursor = context.cursor?.trim() ?? "";

  if (status === 401) {
    return createCategoryParentOptionsError("unauthorized", status, false, error);
  }

  if (status === 403) {
    return createCategoryParentOptionsError("forbidden", status, false, error);
  }

  if (
    excludeSubtreeId != null &&
    (backendCode === "CATEGORY_NOT_FOUND" ||
      backendCode === "CATEGORY_PARENT_NOT_FOUND" ||
      status === 404)
  ) {
    return createCategoryParentOptionsError(
      "stale-category",
      status,
      false,
      error,
    );
  }

  if (
    cursor.length > 0 &&
    (backendCode === "CATEGORY_PARENT_OPTIONS_CURSOR_INVALID" ||
      status === 400 ||
      status === 404 ||
      status === 409)
  ) {
    return createCategoryParentOptionsError(
      "cursor-reset-failed",
      status,
      true,
      error,
    );
  }

  return createCategoryParentOptionsError("load-failed", status, true, error);
}

function getCategoryParentOptionLimit(maximum?: number | null): number {
  return typeof maximum === "number" && Number.isSafeInteger(maximum) && maximum > 0
    ? Math.min(CATEGORY_PARENT_OPTION_LIMIT, maximum)
    : CATEGORY_PARENT_OPTION_LIMIT;
}

export function isBlockingCategoryParentOptionsError(
  error: CategoryParentOptionsError,
): boolean {
  return (
    error.code === "stale-category" ||
    error.code === "forbidden" ||
    error.code === "unauthorized"
  );
}

export function toPositiveInteger(
  value: string | number | null | undefined,
): number | null {
  const trimmed = value == null ? "" : String(value).trim();

  if (trimmed.length === 0) {
    return null;
  }

  const numericValue = Number(trimmed);

  return Number.isSafeInteger(numericValue) && numericValue > 0
    ? numericValue
    : null;
}

function createCategoryParentOptionsError(
  code: CategoryParentOptionsErrorCode,
  status: number | undefined,
  retryable: boolean,
  cause: unknown,
): CategoryParentOptionsError {
  return {
    code,
    message: cause instanceof Error ? cause.message : code,
    retryable,
    status,
  };
}

function getErrorStatus(error: unknown): number | undefined {
  if (!error || typeof error !== "object" || !("status" in error)) {
    return undefined;
  }

  const status = (error as { status?: unknown }).status;

  return typeof status === "number" ? status : undefined;
}
