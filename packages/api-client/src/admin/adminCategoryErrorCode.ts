const adminCategoryBackendErrorCodes = new Set([
  "CATEGORY_CAPABILITY_UNSUPPORTED",
  "CATEGORY_TREE_TOO_LARGE",
  "CATEGORY_PARENT_OPTIONS_CURSOR_INVALID",
  "UNKNOWN_CATEGORY_SYSTEM",
  "CATEGORY_NOT_FOUND",
  "CATEGORY_PARENT_NOT_FOUND",
  "DUPLICATE_CATEGORY_SLUG",
  "CATEGORY_DELETE_BLOCKED",
  "INVALID_CATEGORY_MOVE",
  "INVALID_CATEGORY_PLACEMENT_TARGET",
] as const);

export type AdminCategoryBackendErrorCode =
  (typeof adminCategoryBackendErrorCodes extends Set<infer TCode>
    ? TCode
    : never) &
    string;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function findCode(
  value: unknown,
  visited = new Set<object>(),
): string | undefined {
  if (!isRecord(value) || visited.has(value)) return undefined;
  visited.add(value);
  if (
    typeof value.code === "string" &&
    adminCategoryBackendErrorCodes.has(value.code as never)
  ) {
    return value.code;
  }

  for (const key of ["details", "data", "response", "body"]) {
    const nested = findCode(value[key], visited);
    if (nested) return nested;
  }
  return undefined;
}

export function extractAdminCategoryBackendErrorCode(
  error: unknown,
): AdminCategoryBackendErrorCode | undefined {
  const code = findCode(error);

  return code as AdminCategoryBackendErrorCode | undefined;
}
