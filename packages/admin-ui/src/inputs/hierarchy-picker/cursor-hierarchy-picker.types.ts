export type CursorHierarchyOptionSource = "root" | "selected" | "remote";

export interface CursorHierarchyOption {
  readonly id: string;
  readonly label: string;
  readonly disabled?: boolean;
  readonly source: CursorHierarchyOptionSource;
  /** Domain-owned presentation data. The picker never inspects this value. */
  readonly metadata?: unknown;
}

export interface CursorHierarchySlice {
  readonly options: readonly CursorHierarchyOption[];
  readonly hasMore: boolean;
  readonly nextCursor: string | null;
}

export type CursorHierarchyFailureCode =
  | "invalid-response"
  | "invalid-continuation"
  | "load-failed"
  | "continuation-conflict";

export interface CursorHierarchyFailure {
  readonly code: CursorHierarchyFailureCode;
  readonly cause?: unknown;
  readonly retryable: boolean;
}

export interface CursorHierarchyLoaderContext {
  readonly search: string;
  readonly selectedIds: readonly string[];
}

export type CursorHierarchyLoader = (
  context: CursorHierarchyLoaderContext,
  cursor: string | null,
  signal: AbortSignal,
) => Promise<unknown>;

export type CursorHierarchySliceAdapter = (
  value: unknown,
) => CursorHierarchySlice;

/** Lets a domain adapter reject a malformed transport payload without coupling
 * the shared picker to a particular API or error vocabulary. */
export class CursorHierarchyInvalidResponseError extends Error {
  constructor(cause?: unknown) {
    super("The hierarchy option response is invalid.", { cause });
    this.name = "CursorHierarchyInvalidResponseError";
  }
}

export function isValidCursorHierarchySlice(
  value: CursorHierarchySlice,
): boolean {
  return (
    Array.isArray(value.options) &&
    value.options.every(
      (option) =>
        typeof option.id === "string" &&
        option.id.trim().length > 0 &&
        typeof option.label === "string",
    ) &&
    typeof value.hasMore === "boolean" &&
    (value.nextCursor === null || typeof value.nextCursor === "string")
  );
}
