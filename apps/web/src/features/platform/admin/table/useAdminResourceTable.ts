"use client";

import { useList } from "@refinedev/core";
import type { BaseRecord, HttpError } from "@refinedev/core";
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
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { getAdminResourceMetadata } from "../resources/adminResources";
import type { AdminIdentity } from "../types/admin.types";
import { canPerformAdminAction } from "../utils/adminPermissions";
import type {
  AdminResourceTableConfig,
  AdminResourceTableDisplayContext,
  AdminResourceTableExternalFilter,
  AdminResourceTableHydrationContext,
  AdminResourceTableLocale,
  AdminResourceTableMapContext,
  AdminResourceTablePageMetadata,
  AdminResourceTableResult,
  AdminResourceTableSortResolver,
} from "./admin-resource-table.types";
import {
  applyAdminTablePageSize,
  createAdminTablePaginationState,
  createAdminTableSortingState,
  createDefaultAdminTablePageMetadata,
  getAdminTablePageCount,
  normalizeAdminTableDefaultSort,
  resetAdminTablePageIndex,
  toAdminTableDisplayMetadata,
  toRefinePagination,
  toRefineSorters,
} from "./admin-table-state";

interface UseAdminResourceTableOptions<TDto, TRow> {
  config: AdminResourceTableConfig<TDto, TRow>;
  externalFilters?: AdminResourceTableExternalFilter[];
  identity: AdminIdentity | null;
  locale: AdminResourceTableLocale;
  /** Defaults to true; feature screens can fail closed before transport. */
  queryEnabled?: boolean;
  resetKey?: string;
  resolveSorters?: AdminResourceTableSortResolver;
}

interface AdminListResponse<TDto> {
  page?: AdminResourceTablePageMetadata;
  data?: TDto[];
}

export function useAdminResourceTable<TDto extends BaseRecord, TRow>({
  config,
  externalFilters,
  identity,
  locale,
  queryEnabled = true,
  resetKey,
  resolveSorters,
}: UseAdminResourceTableOptions<TDto, TRow>): AdminResourceTableResult<
  TDto,
  TRow
> {
  const metadata = getAdminResourceMetadata(config.resource);
  const canList = canPerformAdminAction(identity, config.resource, "list");
  const [pagination, setPagination] = useState<PaginationState>(() =>
    createAdminTablePaginationState(),
  );
  const [sorting, setSorting] = useState<SortingState>(() =>
    createAdminTableSortingState(config.defaultSort),
  );
  const [hydratedRows, setHydratedRows] = useState<TRow[]>([]);
  const [hydrationError, setHydrationError] = useState<unknown>(null);
  const [isHydrating, setIsHydrating] = useState(false);
  const hydrationRequestId = useRef(0);
  const previousResetKey = useRef(resetKey);
  const defaultSortKey = JSON.stringify(
    normalizeAdminTableDefaultSort(config.defaultSort),
  );
  const defaultSortingState = useMemo(
    () => createAdminTableSortingState(config.defaultSort),
    // Keep reset behavior keyed by normalized sort values, not config object identity.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [defaultSortKey],
  );

  useEffect(() => {
    if (previousResetKey.current === resetKey) {
      return;
    }

    previousResetKey.current = resetKey;
    setPagination((current) => resetAdminTablePageIndex(current));
  }, [resetKey]);

  useEffect(() => {
    setSorting(defaultSortingState);
    setPagination((current) => resetAdminTablePageIndex(current));
  }, [defaultSortKey, defaultSortingState]);

  const list = useList<TDto, HttpError>({
    resource: config.resource,
    pagination: toRefinePagination(pagination),
    sorters: toRefineSorters(sorting, config.defaultSort, resolveSorters),
    filters: externalFilters,
    queryOptions: {
      enabled: canList && queryEnabled,
    },
  });

  const mapContext = useMemo<AdminResourceTableMapContext>(
    () => ({
      identity,
      locale,
      resource: config.resource,
      metadata,
    }),
    [config.resource, identity, locale, metadata],
  );
  const dtos = list.result.data;
  const mappedRows = useMemo(
    () => dtos.map((dto) => config.mapDtoToRow(dto, mapContext)),
    [config, dtos, mapContext],
  );

  const runHydration = useCallback(async () => {
    setHydrationError(null);

    if (!config.hydrateRows) {
      return;
    }

    const requestId = hydrationRequestId.current + 1;
    hydrationRequestId.current = requestId;
    setIsHydrating(true);

    try {
      const context: AdminResourceTableHydrationContext<TDto, TRow> = {
        identity,
        locale,
        resource: config.resource,
        metadata,
        dtos,
        rows: mappedRows,
      };
      const nextRows = await config.hydrateRows(mappedRows, context);

      if (hydrationRequestId.current === requestId) {
        setHydratedRows(nextRows);
      }
    } catch (error) {
      if (hydrationRequestId.current === requestId) {
        setHydrationError(error);
        setHydratedRows([]);
      }
    } finally {
      if (hydrationRequestId.current === requestId) {
        setIsHydrating(false);
      }
    }
  }, [config, dtos, identity, locale, mappedRows, metadata]);

  useEffect(() => {
    if (!config.hydrateRows) {
      return;
    }

    void runHydration();
  }, [config.hydrateRows, runHydration]);

  const sourceRows = config.hydrateRows ? hydratedRows : mappedRows;
  const rows = useMemo(() => {
    if (!config.beforeDisplayRow) {
      return sourceRows;
    }

    const context: AdminResourceTableDisplayContext<TRow> = {
      identity,
      locale,
      resource: config.resource,
      metadata,
      rows: sourceRows,
    };

    return sourceRows.flatMap((row) => {
      const nextRow = config.beforeDisplayRow?.(row, context);
      return nextRow ? [nextRow] : [];
    });
  }, [config, identity, locale, metadata, sourceRows]);

  const response = list.query.data as AdminListResponse<TDto> | undefined;
  const page =
    response?.page ?? createDefaultAdminTablePageMetadata(pagination, rows.length);
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
      setPagination((current) =>
        resolvePaginationUpdate(current, updater),
      );
    },
    onSortingChange: (updater) => {
      setSorting((current) => functionalUpdate(updater, current));
      setPagination((current) => resetAdminTablePageIndex(current));
    },
  });

  const error = list.query.isError
    ? list.query.error
    : hydrationError
      ? hydrationError
      : null;
  const errorSource = hydrationError ? "hydration" : error ? "list" : undefined;
  const isLoading =
    (list.query.isLoading || isHydrating) && rows.length === 0 && !error;
  const state = canList
    ? error
      ? "error"
      : isLoading
        ? "loading"
        : rows.length === 0
          ? "empty"
          : "ready"
    : "forbidden";

  return {
    config,
    identity,
    locale,
    labels: config.labels,
    table,
    rows,
    page,
    displayMetadata,
    pagination,
    sorting,
    state,
    isLoading,
    isFetching: list.query.isFetching || isHydrating,
    isHydrating,
    isForbidden: !canList,
    error,
    errorSource,
    onRetry: () => {
      if (hydrationError) {
        void runHydration();
        return;
      }

      void list.query.refetch();
    },
    setPageIndex: (pageIndex) => {
      setPagination((current) => ({
        ...current,
        pageIndex,
      }));
    },
    setPageSize: (pageSize) => {
      setPagination((current) => applyAdminTablePageSize(current, pageSize));
    },
  };
}

function resolvePaginationUpdate(
  current: PaginationState,
  updater: Updater<PaginationState>,
): PaginationState {
  const next = functionalUpdate(updater, current);

  if (next.pageSize !== current.pageSize) {
    return applyAdminTablePageSize(current, next.pageSize);
  }

  return next;
}
