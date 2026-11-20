"use client";

import { Pagination } from "@mantine/core";

interface AdminResourceTablePaginationProps {
  label: string;
  page: number;
  total: number;
  onPageChange: (pageIndex: number) => void;
}

export function AdminResourceTablePagination({
  label,
  page,
  total,
  onPageChange,
}: AdminResourceTablePaginationProps) {
  return (
    <Pagination
      aria-label={label}
      total={total}
      value={page}
      onChange={(value) => onPageChange(value - 1)}
    />
  );
}
