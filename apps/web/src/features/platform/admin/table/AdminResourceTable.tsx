"use client";

import { Group, Stack, Table, Text } from "@mantine/core";
import { flexRender } from "@tanstack/react-table";
import { useEffect, useMemo, useRef, type ReactNode } from "react";

import { AdminErrorState } from "../components/AdminErrorState";
import { AdminForbidden } from "../components/AdminForbidden";
import { AdminLoading } from "../components/AdminLoading";
import type {
  AdminResourceTableRenderContext,
  AdminResourceTableResult,
} from "./admin-resource-table.types";
import { AdminResourceTablePagination } from "./AdminResourceTablePagination";
import {
  AdminResourceTableSummary,
  AdminResourceTableToolbar,
} from "./AdminResourceTableToolbar";
import { getAdminTablePageCount } from "./admin-table-state";
import styles from "./AdminResourceTable.module.css";

interface AdminResourceTableProps<TDto, TRow> {
  result: AdminResourceTableResult<TDto, TRow>;
  filters?: ReactNode;
}

export function AdminResourceTable<TDto, TRow>({
  result,
  filters,
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

  let status: ReactNode;
  if (isForbidden) {
    status = (
      <AdminForbidden
        title={labels.forbiddenTitle}
        message={labels.forbiddenMessage}
      />
    );
  } else if (isLoading && rows.length === 0) {
    status = <AdminLoading label={labels.loading} />;
  } else if (error) {
    status = (
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

  if (status && !filters) return status;

  return (
    <Stack ref={tableTopRef} gap="md">
      {!status && <Toolbar {...context} />}
      <div className={styles.panel}>
        {filters}
        {status ?? (
          <>
            {AboveTable ? <AboveTable {...context} /> : null}
            {rows.length === 0 ? (
              EmptyState ? (
                <EmptyState {...context} />
              ) : (
                <Text p="md">{labels.empty}</Text>
              )
            ) : (
              <Table.ScrollContainer
                data-testid="admin-resource-table-scroll"
                minWidth={config.minWidth ?? 880}
              >
                <Table
                  highlightOnHover
                  styles={{
                    table: { backgroundColor: "var(--admin-chrome-bg)" },
                  }}
                  horizontalSpacing="sm"
                  verticalSpacing="sm"
                >
                  <Table.Thead>
                    {table.getHeaderGroups().map((headerGroup) => (
                      <Table.Tr key={headerGroup.id}>
                        {headerGroup.headers.map((header) =>
                          header.isPlaceholder ? null : (
                            <Table.Th
                              key={header.id}
                              data-testid={header.column.columnDef.meta?.testId}
                              style={{
                                minWidth:
                                  header.column.columnDef.meta?.minWidth,
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
            <Group component="footer" className={styles.footer} gap="xs">
              {!config.components?.Toolbar && (
                <AdminResourceTableSummary {...context} />
              )}
              <AdminResourceTablePagination
                label={labels.paginationLabel}
                page={pagination.pageIndex + 1}
                total={getAdminTablePageCount(page)}
                onPageChange={setPageIndex}
              />
            </Group>
          </>
        )}
      </div>
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
