"use client";

import {
  functionalUpdate,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import type {
  PaginationState,
  SortingState,
  Updater,
} from "@tanstack/react-table";
import { useMemo } from "react";

import type { AdminIdentity } from "../types/admin.types";
import type {
  AdminResourceTableConfig,
  AdminResourceTableLocale,
  AdminResourceTablePageMetadata,
  AdminResourceTableResult,
  AdminResourceTableSortOrder,
} from "./admin-resource-table.types";
import {
  getAdminTablePageCount,
  normalizeAdminTableDefaultSort,
  toAdminTableDisplayMetadata,
} from "./admin-table-state";

interface UseAdminResourceTableViewResultOptions<TDto, TRow> {
  config: AdminResourceTableConfig<TDto, TRow>;
  identity: AdminIdentity | null;
  locale: AdminResourceTableLocale;
  rows: TRow[];
  currentPage: number;
  pageSize: number;
  sortField: string;
  sortOrder: AdminResourceTableSortOrder;
  page?: AdminResourceTablePageMetadata;
  loading?: boolean;
  fetching?: boolean;
  error?: boolean;
  forbidden?: boolean;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  onRetry?: () => void;
  onSortChange?: (field: string, order: AdminResourceTableSortOrder) => void;
}

export function useAdminResourceTableViewResult<TDto, TRow>({
  config,
  currentPage,
  error = false,
  fetching = false,
  forbidden = false,
  identity,
  loading = false,
  locale,
  onPageChange,
  onPageSizeChange,
  onRetry,
  onSortChange,
  page,
  pageSize,
  rows,
  sortField,
  sortOrder,
}: UseAdminResourceTableViewResultOptions<TDto, TRow>): AdminResourceTableResult<
  TDto,
  TRow
> {
  const pagination = useMemo<PaginationState>(
    () => ({
      pageIndex: Math.max(currentPage - 1, 0),
      pageSize,
    }),
    [currentPage, pageSize],
  );
  const sorting = useMemo<SortingState>(
    () => [
      {
        id: sortField,
        desc: sortOrder === "desc",
      },
    ],
    [sortField, sortOrder],
  );
  const displayMetadata = toAdminTableDisplayMetadata(
    page,
    pagination,
    rows.length,
  );
  const table = useReactTable({
    data: rows,
    columns: config.columns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: config.getRowId,
    manualPagination: true,
    manualSorting: true,
    enableSortingRemoval: false,
    pageCount: getAdminTablePageCount(page),
    state: {
      pagination,
      sorting,
    },
    onPaginationChange: (updater) => {
      const next = resolvePaginationUpdate(pagination, updater);

      if (next.pageSize !== pagination.pageSize) {
        onPageSizeChange?.(next.pageSize);
        return;
      }

      if (next.pageIndex !== pagination.pageIndex) {
        onPageChange?.(next.pageIndex + 1);
      }
    },
    onSortingChange: (updater) => {
      const [nextSort] = functionalUpdate(updater, sorting);
      const [defaultSort] = normalizeAdminTableDefaultSort(config.defaultSort);

      onSortChange?.(
        nextSort?.id ?? defaultSort?.field ?? "updatedAt",
        nextSort?.desc ? "desc" : "asc",
      );
    },
  });
  const state = forbidden
    ? "forbidden"
    : error
      ? "error"
      : loading
        ? "loading"
        : rows.length === 0
          ? "empty"
          : "ready";

  return {
    config,
    identity,
    locale,
    labels: config.labels,
    table,
    rows,
    page:
      page ??
      {
        number: pagination.pageIndex,
        size: pagination.pageSize,
        totalElements: rows.length,
        totalPages: Math.max(Math.ceil(rows.length / pagination.pageSize), 1),
        numberOfElements: rows.length,
        first: pagination.pageIndex === 0,
        last: true,
      },
    displayMetadata,
    pagination,
    sorting,
    state,
    isLoading: loading,
    isFetching: fetching,
    isHydrating: false,
    isForbidden: forbidden,
    error: error ? true : null,
    errorSource: error ? "list" : undefined,
    onRetry: () => onRetry?.(),
    setPageIndex: (pageIndex) => onPageChange?.(pageIndex + 1),
    setPageSize: (nextPageSize) => onPageSizeChange?.(nextPageSize),
  };
}

function resolvePaginationUpdate(
  current: PaginationState,
  updater: Updater<PaginationState>,
): PaginationState {
  return functionalUpdate(updater, current);
}
