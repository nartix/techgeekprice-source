export const INCOMPLETE_TREE_RESPONSE_CODE =
  "small-category-tree.incomplete-response" as const;

export type SmallCategoryTreeLoadErrorCode =
  | "too-large"
  | "unauthorized"
  | "forbidden"
  | "invalid-sort"
  | "invalid-request"
  | "incomplete-tree-response"
  | "load-failed";

export interface SmallCategoryTreeLoadError {
  code: SmallCategoryTreeLoadErrorCode;
  message: string;
  retryable: boolean;
  status?: number;
  cause?: unknown;
}

export function classifySmallCategoryTreeLoadError(
  error: unknown,
): SmallCategoryTreeLoadError {
  const status = getErrorStatus(error);
  const backendCode = getErrorCode(error);

  if (backendCode === INCOMPLETE_TREE_RESPONSE_CODE) {
    return {
      code: "incomplete-tree-response",
      message: "incomplete-tree-response",
      retryable: true,
      status,
      cause: error,
    };
  }

  if (status === 409 && backendCode === "CATEGORY_TREE_TOO_LARGE") {
    return {
      code: "too-large",
      message: "too-large",
      retryable: false,
      status,
      cause: error,
    };
  }

  if (status === 401) {
    return {
      code: "unauthorized",
      message: "unauthorized",
      retryable: false,
      status,
      cause: error,
    };
  }

  if (status === 403) {
    return {
      code: "forbidden",
      message: "forbidden",
      retryable: false,
      status,
      cause: error,
    };
  }

  if (status === 400 && backendCode === "INVALID_SORT_FIELD") {
    return {
      code: "invalid-sort",
      message: "invalid-sort",
      retryable: true,
      status,
      cause: error,
    };
  }

  if (status === 400 && backendCode === "VALIDATION_FAILED") {
    return {
      code: "invalid-request",
      message: "invalid-request",
      retryable: true,
      status,
      cause: error,
    };
  }

  return {
    code: "load-failed",
    message: "load-failed",
    retryable: true,
    status,
    cause: error,
  };
}

function getErrorStatus(error: unknown): number | undefined {
  if (!isRecord(error)) {
    return undefined;
  }

  const candidates = [
    error.status,
    error.statusCode,
    isRecord(error.response) ? error.response.status : undefined,
    isRecord(error.details) ? error.details.status : undefined,
    isRecord(error.data) ? error.data.status : undefined,
    isRecord(error.response) && isRecord(error.response.data)
      ? error.response.data.status
      : undefined,
  ];

  for (const candidate of candidates) {
    const status = normalizeStatus(candidate);

    if (status) {
      return status;
    }
  }

  return undefined;
}

function getErrorCode(error: unknown): string | undefined {
  if (!isRecord(error)) {
    return undefined;
  }

  if (error.code === INCOMPLETE_TREE_RESPONSE_CODE) {
    return error.code;
  }

  const stableCategoryCode = extractAdminCategoryBackendErrorCode(error);

  if (stableCategoryCode) {
    return stableCategoryCode;
  }

  const details = error.details;

  if (isRecord(details) && typeof details.code === "string") {
    return details.code;
  }

  const response = error.response;
  const data = isRecord(response) ? response.data : undefined;

  if (isRecord(data) && typeof data.code === "string") {
    return data.code;
  }

  if (typeof error.code === "string") {
    return error.code;
  }

  return undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function normalizeStatus(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isInteger(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number.parseInt(value, 10);

    return Number.isInteger(parsed) ? parsed : undefined;
  }

  return undefined;
}
import { extractAdminCategoryBackendErrorCode } from "@tgp/api-client";
