"use client";

import { Group, Text, UnstyledButton } from "@mantine/core";
import {
  IconArrowsSort,
  IconSortAscending,
  IconSortDescending,
} from "@tabler/icons-react";
import type { Column } from "@tanstack/react-table";
import { useTranslations } from "next-intl";

interface AdminSortableHeaderProps<TData, TValue> {
  column: Column<TData, TValue>;
  label: string;
}

export function AdminSortableHeader<TData, TValue>({
  column,
  label,
}: AdminSortableHeaderProps<TData, TValue>) {
  const t = useTranslations("Admin.Table.sort");
  const sortState = column.getIsSorted();

  if (!column.getCanSort()) {
    return (
      <Text fw={700} size="sm">
        {label}
      </Text>
    );
  }

  const accessibleLabel =
    sortState === "asc"
      ? t("ascendingLabel", { field: label })
      : sortState === "desc"
        ? t("descendingLabel", { field: label })
        : t("inactiveLabel", { field: label });
  const SortIcon =
    sortState === "asc"
      ? IconSortAscending
      : sortState === "desc"
        ? IconSortDescending
        : IconArrowsSort;

  return (
    <UnstyledButton
      aria-label={accessibleLabel}
      onClick={column.getToggleSortingHandler()}
    >
      <Group gap={4} wrap="nowrap">
        <Text fw={700} size="sm">
          {label}
        </Text>
        <SortIcon aria-hidden="true" size={16} stroke={1.8} />
      </Group>
    </UnstyledButton>
  );
}
