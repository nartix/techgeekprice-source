"use client";

import { ScrollArea, Table } from "@mantine/core";
import { useTranslations } from "next-intl";

import {
  getVisibleSmallCategoryTreeRows,
  type SmallCategoryTreeModel,
  type SmallCategoryTreeRow,
} from "../category-tree-model";
import type { AdminIdentity } from "../../../../../platform/admin/types/admin.types";
import type { AdminCategoryListingConfig } from "../../admin-category-listing.config";
import type { AdminLocale } from "../../types/category-admin.types";

import { SmallCategoryTreeRow as SmallCategoryTreeTableRow } from "./SmallCategoryTreeRow";

interface SmallCategoryTreeTableProps {
  actionsEnabled: boolean;
  canActivate: boolean;
  canDeactivate: boolean;
  canMove: boolean;
  deleteLoading: boolean;
  expandedIds: Set<string>;
  identity: AdminIdentity | null;
  locale: AdminLocale;
  model: SmallCategoryTreeModel;
  moveLoading: boolean;
  permissionResource: AdminCategoryListingConfig["permissionResource"];
  showRank: boolean;
  showHref: AdminCategoryListingConfig["showHref"];
  editHref: AdminCategoryListingConfig["editHref"];
  stateLoading: boolean;
  onActionSuccess: () => void;
  onDeleteRow: (row: SmallCategoryTreeRow) => Promise<void> | void;
  onMoveRow: (row: SmallCategoryTreeRow) => void;
  onStateChangeRow: (
    row: SmallCategoryTreeRow,
    nextActive: boolean,
  ) => Promise<void> | void;
  onToggleRow: (rowId: string) => void;
}

export function SmallCategoryTreeTable({
  actionsEnabled,
  canActivate,
  canDeactivate,
  canMove,
  deleteLoading,
  expandedIds,
  identity,
  locale,
  model,
  moveLoading,
  permissionResource,
  showRank,
  showHref,
  editHref,
  stateLoading,
  onActionSuccess,
  onDeleteRow,
  onMoveRow,
  onStateChangeRow,
  onToggleRow,
}: SmallCategoryTreeTableProps) {
  const t = useTranslations("Admin.ProductCategories.tree");
  const rows = getVisibleSmallCategoryTreeRows(model, expandedIds);

  return (
    <ScrollArea type="auto">
      <Table
        aria-label={t("title")}
        data-density="compact"
        data-scroll-goal="less-scrolling"
        horizontalSpacing="xs"
        highlightOnHover
        striped
        verticalSpacing="xs"
        withColumnBorders={false}
        withRowBorders
        withTableBorder
        miw={showRank ? 720 : 640}
      >
        <Table.Thead>
          <Table.Tr>
            <Table.Th>{t("columns.category")}</Table.Th>
            {showRank ? <Table.Th>{t("columns.rank")}</Table.Th> : null}
            <Table.Th>{t("columns.status")}</Table.Th>
            <Table.Th>{t("columns.updated")}</Table.Th>
            <Table.Th>{t("columns.actions")}</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {rows.map((row) => (
            <SmallCategoryTreeTableRow
              actionsEnabled={actionsEnabled}
              canActivate={canActivate}
              canDeactivate={canDeactivate}
              canMove={canMove}
              deleteLoading={deleteLoading}
              expanded={expandedIds.has(row.id)}
              identity={identity}
              key={row.id}
              locale={locale}
              moveLoading={moveLoading}
              permissionResource={permissionResource}
              row={row}
              showRank={showRank}
              showHref={showHref}
              editHref={editHref}
              stateLoading={stateLoading}
              onActionSuccess={onActionSuccess}
              onDeleteRow={onDeleteRow}
              onMoveRow={onMoveRow}
              onStateChangeRow={onStateChangeRow}
              onToggleRow={onToggleRow}
            />
          ))}
        </Table.Tbody>
      </Table>
    </ScrollArea>
  );
}
