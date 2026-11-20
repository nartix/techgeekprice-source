export const DEFAULT_ADMIN_PAGE_SIZE = 20;
export const ALLOWED_ADMIN_PAGE_SIZES = [3, 5, 10, 20, 50] as const;
export const MAX_ADMIN_PAGE_SIZE = 100;

export type AllowedAdminPageSize = (typeof ALLOWED_ADMIN_PAGE_SIZES)[number];

export function isAllowedAdminPageSize(
  size: number,
): size is AllowedAdminPageSize {
  return ALLOWED_ADMIN_PAGE_SIZES.includes(size as AllowedAdminPageSize);
}

export function enforceAdminPageSize(size: number): AllowedAdminPageSize {
  if (!isAllowedAdminPageSize(size)) {
    throw new RangeError(
      `Admin page size must be one of ${ALLOWED_ADMIN_PAGE_SIZES.join(", ")}.`,
    );
  }

  if (size > MAX_ADMIN_PAGE_SIZE) {
    throw new RangeError(
      `Admin page size must not exceed ${MAX_ADMIN_PAGE_SIZE}.`,
    );
  }

  return size;
}
