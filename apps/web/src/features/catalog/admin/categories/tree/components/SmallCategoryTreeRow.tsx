"use client";

import { ActionIcon, Badge, Group, Table, Text } from "@mantine/core";
import { IconChevronDown, IconChevronRight } from "@tabler/icons-react";
import { useTranslations } from "next-intl";

import type { AdminIdentity } from "../../../../../platform/admin/types/admin.types";
import type { AdminCategoryListingConfig } from "../../admin-category-listing.config";
import { CategoryActionsView } from "../../components/CategoryActions";
import type { AdminLocale } from "../../types/category-admin.types";
import type { SmallCategoryTreeRow as SmallCategoryTreeRowValue } from "../category-tree-model";

interface SmallCategoryTreeRowProps {
  actionsEnabled: boolean;
  canActivate: boolean;
  canDeactivate: boolean;
  canMove: boolean;
  deleteLoading: boolean;
  expanded: boolean;
  identity: AdminIdentity | null;
  locale: AdminLocale;
  moveLoading: boolean;
  permissionResource: AdminCategoryListingConfig["permissionResource"];
  row: SmallCategoryTreeRowValue;
  showRank: boolean;
  showHref: AdminCategoryListingConfig["showHref"];
  editHref: AdminCategoryListingConfig["editHref"];
  stateLoading: boolean;
  onActionSuccess: () => void;
  onDeleteRow: (row: SmallCategoryTreeRowValue) => Promise<void> | void;
  onMoveRow: (row: SmallCategoryTreeRowValue) => void;
  onStateChangeRow: (
    row: SmallCategoryTreeRowValue,
    nextActive: boolean,
  ) => Promise<void> | void;
  onToggleRow: (rowId: string) => void;
}

export function SmallCategoryTreeRow({
  actionsEnabled,
  canActivate,
  canDeactivate,
  canMove,
  deleteLoading,
  expanded,
  identity,
  locale,
  moveLoading,
  permissionResource,
  row,
  showRank,
  showHref,
  editHref,
  stateLoading,
  onActionSuccess,
  onDeleteRow,
  onMoveRow,
  onStateChangeRow,
  onToggleRow,
}: SmallCategoryTreeRowProps) {
  const t = useTranslations("Admin.ProductCategories.tree");
  const tStatus = useTranslations("Admin.ProductCategories.status");
  const toggleLabel = expanded
    ? t("actions.collapseRow", { name: row.name })
    : t("actions.expandRow", { name: row.name });

  return (
    <Table.Tr data-density="compact">
      <Table.Td>
        <Group gap="xs" wrap="nowrap" style={{ paddingLeft: row.depth * 24 }}>
          {row.hasChildren ? (
            <ActionIcon
              aria-label={toggleLabel}
              aria-expanded={expanded}
              size="sm"
              variant="subtle"
              onClick={() => onToggleRow(row.id)}
            >
              {expanded ? (
                <IconChevronDown aria-hidden="true" size={16} />
              ) : (
                <IconChevronRight aria-hidden="true" size={16} />
              )}
            </ActionIcon>
          ) : (
            <span aria-hidden="true" className="inline-block h-7 w-7 shrink-0" />
          )}
          <div className="flex min-w-0 items-baseline gap-2">
            <Text fw={600} size="sm" truncate="end">
              {row.name}
            </Text>
            <Text c="dimmed" size="xs" truncate="end">
              {row.slug}
            </Text>
          </div>
        </Group>
      </Table.Td>
      {showRank ? (
        <Table.Td className="whitespace-nowrap text-sm">
          {row.sortRank == null ? "-" : row.sortRank}
        </Table.Td>
      ) : null}
      <Table.Td className="whitespace-nowrap">
        <Badge color={row.active ? "green" : "gray"} size="xs" variant="light">
          {row.active ? tStatus("active") : tStatus("inactive")}
        </Badge>
      </Table.Td>
      <Table.Td className="whitespace-nowrap text-sm">{row.updatedAtLabel}</Table.Td>
      <Table.Td className="whitespace-nowrap">
        <Group gap={0} justify="flex-end" wrap="nowrap">
          <CategoryActionsView
            category={row}
            deleteLoading={deleteLoading}
            editHref={editHref(row.id)}
            identity={actionsEnabled ? identity : null}
            locale={locale}
            moveActionsAvailable={canMove}
            moveLoading={moveLoading}
            permissionResource={permissionResource}
            stateActionsAvailable={row.active ? canDeactivate : canActivate}
            stateLoading={stateLoading}
            viewHref={showHref(row.id)}
            onDelete={() => onDeleteRow(row)}
            onDeleteSuccess={onActionSuccess}
            onMoveRequest={() => onMoveRow(row)}
            onStateChange={(_, nextActive) =>
              onStateChangeRow(row, nextActive)
            }
            onStateChangeSuccess={onActionSuccess}
          />
        </Group>
      </Table.Td>
    </Table.Tr>
  );
}
