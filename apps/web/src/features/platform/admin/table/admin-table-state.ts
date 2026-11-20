import type { PaginationState, SortingState } from "@tanstack/react-table";

import {
  DEFAULT_ADMIN_PAGE_SIZE,
  enforceAdminPageSize,
} from "../utils/adminPageSizePolicy";
import type {
  AdminResourceTableDefaultSort,
  AdminResourceTableDisplayMetadata,
  AdminResourceTablePageMetadata,
  AdminResourceTableSort,
  AdminResourceTableSortResolver,
} from "./admin-resource-table.types";

export const DEFAULT_ADMIN_TABLE_SORT = {
  field: "updatedAt",
  order: "desc",
} as const satisfies AdminResourceTableSort;

export function createAdminTablePaginationState(
  pageSize = DEFAULT_ADMIN_PAGE_SIZE,
): PaginationState {
  return {
    pageIndex: 0,
    pageSize: enforceAdminPageSize(pageSize),
  };
}

export function createAdminTableSortingState(
  sort: AdminResourceTableDefaultSort = DEFAULT_ADMIN_TABLE_SORT,
): SortingState {
  return normalizeAdminTableDefaultSort(sort).map((item) => ({
    id: item.field,
    desc: item.order === "desc",
  }));
}

export function toRefinePagination(pagination: PaginationState) {
  return {
    currentPage: pagination.pageIndex + 1,
    pageSize: pagination.pageSize,
    mode: "server" as const,
  };
}

export function toRefineSorters(
  sorting: SortingState,
  defaultSort: AdminResourceTableDefaultSort = DEFAULT_ADMIN_TABLE_SORT,
  resolveSorters?: AdminResourceTableSortResolver,
): AdminResourceTableSort[] {
  const normalizedDefaultSort = normalizeAdminTableDefaultSort(defaultSort);

  if (resolveSorters) {
    return resolveSorters({
      sorting,
      defaultSort: normalizedDefaultSort,
    });
  }

  if (sorting.length === 0) {
    return normalizedDefaultSort;
  }

  return sorting.map((sort) => ({
      field: sort.id,
      order: sort.desc ? "desc" : "asc",
  }));
}

export function normalizeAdminTableDefaultSort(
  sort: AdminResourceTableDefaultSort,
): AdminResourceTableSort[] {
  return Array.isArray(sort) ? sort : [sort];
}

export function applyAdminTablePageSize(
  pagination: PaginationState,
  pageSize: number,
): PaginationState {
  return {
    ...pagination,
    pageIndex: 0,
    pageSize: enforceAdminPageSize(pageSize),
  };
}

export function resetAdminTablePageIndex(
  pagination: PaginationState,
): PaginationState {
  return {
    ...pagination,
    pageIndex: 0,
  };
}

export function createDefaultAdminTablePageMetadata(
  pagination: PaginationState,
  rowCount = 0,
): AdminResourceTablePageMetadata {
  const totalPages = Math.max(Math.ceil(rowCount / pagination.pageSize), 1);

  return {
    number: pagination.pageIndex,
    size: pagination.pageSize,
    totalElements: rowCount,
    totalPages,
    numberOfElements: rowCount,
    first: pagination.pageIndex === 0,
    last: pagination.pageIndex >= totalPages - 1,
  };
}

export function toAdminTableDisplayMetadata(
  page: AdminResourceTablePageMetadata | undefined,
  pagination: PaginationState,
  rowCount = 0,
): AdminResourceTableDisplayMetadata {
  const metadata =
    page ?? createDefaultAdminTablePageMetadata(pagination, rowCount);
  const totalPages = Math.max(metadata.totalPages, 1);
  const displayPage = metadata.number + 1;

  return {
    page: displayPage,
    totalPages,
    total: metadata.totalElements,
    numberOfElements: metadata.numberOfElements,
    outOfRange: metadata.totalPages > 0 && metadata.number >= metadata.totalPages,
  };
}

export function getAdminTablePageCount(
  page: AdminResourceTablePageMetadata | undefined,
): number {
  return Math.max(page?.totalPages ?? 1, 1);
}
