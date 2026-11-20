import type { DataProvider } from "@refinedev/core";
import { extractAdminCategoryBackendErrorCode } from "@tgp/api-client";

const DEFAULT_CATEGORY_API_BASE_PATH =
  "/api/v1/admin/category-systems/catalogue/categories";

export interface AppendCategoryMovePayload {
  newParentId: number | null;
}

export type SmallCategoryTreeMoveErrorCode =
  | "stale"
  | "unsupportedPlacement"
  | "invalidPlacementTarget"
  | "rankRebalanceRejected"
  | "categoryNotFound"
  | "validationFailed"
  | "unauthorized"
  | "forbidden"
  | "genericError";

export interface SmallCategoryTreeMoveError {
  code: SmallCategoryTreeMoveErrorCode;
  message: string;
  refreshCapabilities: boolean;
  refreshTree: boolean;
  retryable: boolean;
  status?: number;
  cause?: unknown;
}

export function parsePositiveCategoryId(value: string | number): number {
  const numericValue =
    typeof value === "number" ? value : Number(value.trim());

  if (!Number.isSafeInteger(numericValue) || numericValue <= 0) {
    throw new TypeError("Category ID must be a positive safe integer.");
  }

  return numericValue;
}

export function createAppendCategoryMovePayload(
  newParentId: string | number | null,
): AppendCategoryMovePayload {
  if (newParentId == null || String(newParentId).trim().length === 0) {
    return { newParentId: null };
  }

  return {
    newParentId: parsePositiveCategoryId(newParentId),
  };
}

export async function submitAppendCategoryMove({
  apiBasePath,
  categoryId,
  dataProvider,
  enabled = true,
  newParentId,
}: {
  apiBasePath?: string;
  categoryId: string | number;
  dataProvider: Pick<DataProvider, "custom"> | undefined;
  /** Re-evaluated by the caller immediately before transport. */
  enabled?: boolean;
  newParentId: string | number | null;
}): Promise<void> {
  if (!enabled) {
    throw new Error("Category move is unavailable.");
  }

  if (!dataProvider?.custom) {
    throw new Error("Admin data provider is unavailable.");
  }

  const parsedCategoryId = parsePositiveCategoryId(categoryId);

  await dataProvider.custom<Record<string, unknown>>({
    method: "post",
    payload: createAppendCategoryMovePayload(newParentId),
    url: `${createCategoryApiBasePath(apiBasePath)}/${parsedCategoryId}/move`,
  });
}

function createCategoryApiBasePath(apiBasePath?: string): string {
  return (apiBasePath ?? DEFAULT_CATEGORY_API_BASE_PATH).replace(/\/+$/, "");
}

export function classifySmallCategoryTreeMoveError(
  error: unknown,
): SmallCategoryTreeMoveError {
  const status = getErrorStatus(error);
  const backendCode = getErrorCode(error);

  if (status === 401) {
    return moveError("unauthorized", error, status, false, false, false);
  }

  if (status === 403) {
    return moveError("forbidden", error, status, false, false, false);
  }

  if (backendCode === "UNSUPPORTED_CATEGORY_PLACEMENT") {
    return moveError("unsupportedPlacement", error, status, true, true, true);
  }

  if (backendCode === "INVALID_CATEGORY_PLACEMENT_TARGET") {
    return moveError("invalidPlacementTarget", error, status, true, false, true);
  }

  if (backendCode === "CATEGORY_RANK_REBALANCE_REJECTED") {
    return moveError("rankRebalanceRejected", error, status, true, false, true);
  }

  if (backendCode === "CATEGORY_NOT_FOUND" || status === 404) {
    return moveError("categoryNotFound", error, status, true, false, true);
  }

  if (isStaleMoveCode(backendCode)) {
    return moveError("stale", error, status, true, false, true);
  }

  if (isInvalidMoveTargetCode(backendCode)) {
    return moveError("invalidPlacementTarget", error, status, true, false, true);
  }

  if (status === 400 || backendCode === "VALIDATION_FAILED") {
    return moveError("validationFailed", error, status, false, false, true);
  }

  return moveError("genericError", error, status, false, false, true);
}

function moveError(
  code: SmallCategoryTreeMoveErrorCode,
  cause: unknown,
  status: number | undefined,
  refreshTree: boolean,
  refreshCapabilities: boolean,
  retryable: boolean,
): SmallCategoryTreeMoveError {
  return {
    code,
    message: code,
    refreshCapabilities,
    refreshTree,
    retryable,
    status,
    cause,
  };
}

function isStaleMoveCode(code: string | undefined): boolean {
  return (
    code === "CATEGORY_TREE_STALE" ||
    code === "CATEGORY_MOVE_STALE" ||
    code === "CATEGORY_MOVE_TARGET_STALE" ||
    code === "CATEGORY_TARGET_STALE" ||
    code === "STALE_CATEGORY_TREE"
  );
}

function isInvalidMoveTargetCode(code: string | undefined): boolean {
  return (
    code === "CATEGORY_PARENT_CYCLE" ||
    code === "CATEGORY_PARENT_SELF" ||
    code === "CATEGORY_PARENT_DESCENDANT" ||
    code === "INVALID_CATEGORY_PARENT"
  );
}

function getErrorStatus(error: unknown): number | undefined {
  if (!isRecord(error)) {
    return undefined;
  }

  const status = error.status;

  return typeof status === "number" ? status : undefined;
}

function getErrorCode(error: unknown): string | undefined {
  if (!isRecord(error)) {
    return undefined;
  }

  const stableCategoryCode = extractAdminCategoryBackendErrorCode(error);
  if (stableCategoryCode) return stableCategoryCode;

  if (typeof error.code === "string") return error.code;

  const details = error.details;

  if (isRecord(details) && typeof details.code === "string") {
    return details.code;
  }

  const response = error.response;
  const data = isRecord(response) ? response.data : undefined;

  if (isRecord(data) && typeof data.code === "string") {
    return data.code;
  }

  return undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}
