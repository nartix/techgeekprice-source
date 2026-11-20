"use client";

import { Stack, Table, Text } from "@mantine/core";
import { flexRender } from "@tanstack/react-table";
import { useEffect, useMemo, useRef } from "react";

import { AdminErrorState } from "../components/AdminErrorState";
import { AdminForbidden } from "../components/AdminForbidden";
import { AdminLoading } from "../components/AdminLoading";
import type {
  AdminResourceTableRenderContext,
  AdminResourceTableResult,
} from "./admin-resource-table.types";
import { AdminResourceTablePagination } from "./AdminResourceTablePagination";
import { AdminResourceTableToolbar } from "./AdminResourceTableToolbar";
import { getAdminTablePageCount } from "./admin-table-state";

interface AdminResourceTableProps<TDto, TRow> {
  result: AdminResourceTableResult<TDto, TRow>;
}

export function AdminResourceTable<TDto, TRow>({
  result,
}: AdminResourceTableProps<TDto, TRow>) {
  const {
    config,
    displayMetadata,
    error,
    errorSource,
    isFetching,
    isForbidden,
    isLoading,
    labels,
    onRetry,
    page,
    pagination,
    rows,
    setPageIndex,
    setPageSize,
    sorting,
    table,
  } = result;
  const tableTopRef = useScrollAdminResourceTableToTopOnPageChange(
    pagination.pageIndex,
  );

  const context = useMemo<AdminResourceTableRenderContext<TRow>>(
    () => ({
      identity: result.identity,
      locale: result.locale,
      resource: config.resource,
      table,
      rows,
      page,
      displayMetadata,
      pagination,
      sorting,
      labels,
      createAction: config.createAction,
      isLoading,
      isFetching,
      isError: Boolean(error),
      isForbidden,
      onRetry,
      setPageIndex,
      setPageSize,
    }),
    [
      config.createAction,
      config.resource,
      displayMetadata,
      error,
      isFetching,
      isForbidden,
      isLoading,
      labels,
      onRetry,
      page,
      pagination,
      result.identity,
      result.locale,
      rows,
      setPageIndex,
      setPageSize,
      sorting,
      table,
    ],
  );

  if (isForbidden) {
    return (
      <AdminForbidden
        title={labels.forbiddenTitle}
        message={labels.forbiddenMessage}
      />
    );
  }

  if (isLoading && rows.length === 0) {
    return <AdminLoading label={labels.loading} />;
  }

  if (error) {
    return (
      <AdminErrorState
        title={
          errorSource === "hydration"
            ? labels.hydrationErrorTitle
            : labels.errorTitle
        }
        message={
          errorSource === "hydration"
            ? labels.hydrationErrorMessage
            : labels.errorMessage
        }
        retryLabel={labels.retry}
        onRetry={onRetry}
      />
    );
  }

  const Toolbar = config.components?.Toolbar ?? AdminResourceTableToolbar;
  const AboveTable = config.components?.AboveTable;
  const EmptyState = config.components?.EmptyState;

  return (
    <Stack ref={tableTopRef} gap="md">
      <Toolbar {...context} />
      {AboveTable ? <AboveTable {...context} /> : null}
      {rows.length === 0 ? (
        EmptyState ? (
          <EmptyState {...context} />
        ) : (
          <Text>{labels.empty}</Text>
        )
      ) : (
        <Table.ScrollContainer
          data-testid="admin-resource-table-scroll"
          minWidth={config.minWidth ?? 880}
        >
          <Table striped highlightOnHover withTableBorder>
            <Table.Thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <Table.Tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) =>
                    header.isPlaceholder ? null : (
                      <Table.Th
                        key={header.id}
                        data-testid={header.column.columnDef.meta?.testId}
                        style={{
                          minWidth: header.column.columnDef.meta?.minWidth,
                          textAlign: header.column.columnDef.meta?.align,
                          width: header.column.columnDef.meta?.width,
                        }}
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                      </Table.Th>
                    ),
                  )}
                </Table.Tr>
              ))}
            </Table.Thead>
            <Table.Tbody>
              {table.getRowModel().rows.map((row) => (
                <Table.Tr key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <Table.Td
                      key={cell.id}
                      data-testid={cell.column.columnDef.meta?.testId}
                      style={{
                        textAlign: cell.column.columnDef.meta?.align,
                      }}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </Table.Td>
                  ))}
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      )}
      <AdminResourceTablePagination
        label={labels.paginationLabel}
        page={pagination.pageIndex + 1}
        total={getAdminTablePageCount(page)}
        onPageChange={setPageIndex}
      />
    </Stack>
  );
}

function useScrollAdminResourceTableToTopOnPageChange(pageIndex: number) {
  const topRef = useRef<HTMLDivElement | null>(null);
  const previousPageIndex = useRef(pageIndex);

  useEffect(() => {
    if (previousPageIndex.current === pageIndex) {
      return;
    }

    previousPageIndex.current = pageIndex;

    if (
      !topRef.current ||
      typeof topRef.current.scrollIntoView !== "function"
    ) {
      return;
    }

    const prefersReducedMotion =
      typeof window !== "undefined" &&
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    topRef.current.scrollIntoView({
      block: "start",
      behavior: prefersReducedMotion ? "auto" : "smooth",
    });
  }, [pageIndex]);

  return topRef;
}
