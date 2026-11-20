import type { AdminCategoryDto } from "@tgp/contracts";

import { mapCategoryDtoToListItem } from "../mappers/category-admin.mapper";
import type { AdminLocale, CategoryAdminListItem } from "../types/category-admin.types";

export type SmallCategoryTreeMoveTargetBlockReason = "self" | "descendant";

export interface SmallCategoryTreeRow extends CategoryAdminListItem {
  ancestorIds: string[];
}

export interface SmallCategoryTreeModel {
  rows: SmallCategoryTreeRow[];
  rowsById: Map<string, SmallCategoryTreeRow>;
  childIdsByParentId: Map<string | null, string[]>;
  descendantIdsById: Map<string, Set<string>>;
}

export function createSmallCategoryTreeModel(
  categories: AdminCategoryDto[],
  locale: AdminLocale,
): SmallCategoryTreeModel {
  const rows: SmallCategoryTreeRow[] = categories.map((category) => ({
    ...mapCategoryDtoToListItem(category, locale),
    ancestorIds: [],
  }));
  const rowsById = new Map(rows.map((row) => [row.id, row]));
  const childIdsByParentId = new Map<string | null, string[]>();
  const descendantIdsById = new Map<string, Set<string>>();

  for (const row of rows) {
    descendantIdsById.set(row.id, new Set());
    const siblings = childIdsByParentId.get(row.parentId) ?? [];

    siblings.push(row.id);
    childIdsByParentId.set(row.parentId, siblings);
  }

  for (const row of rows) {
    let parentId = row.parentId;
    const ancestorIds: string[] = [];

    while (parentId != null) {
      const parent = rowsById.get(parentId);

      if (!parent) {
        break;
      }

      ancestorIds.push(parent.id);
      descendantIdsById.get(parent.id)?.add(row.id);
      parentId = parent.parentId;
    }

    row.ancestorIds = ancestorIds;
  }

  return {
    rows,
    rowsById,
    childIdsByParentId,
    descendantIdsById,
  };
}

export function getInitialExpandedIds(
  model: SmallCategoryTreeModel,
): Set<string> {
  return new Set(model.rows.filter((row) => row.hasChildren).map((row) => row.id));
}

export function getVisibleSmallCategoryTreeRows(
  model: SmallCategoryTreeModel,
  expandedIds: Set<string>,
): SmallCategoryTreeRow[] {
  return model.rows.filter((row) =>
    row.ancestorIds.every((ancestorId) => expandedIds.has(ancestorId)),
  );
}

export function isSmallCategoryTreeMoveTargetBlocked(
  model: SmallCategoryTreeModel,
  categoryId: string,
  targetParentId: string | null,
): SmallCategoryTreeMoveTargetBlockReason | null {
  if (targetParentId == null) {
    return null;
  }

  if (categoryId === targetParentId) {
    return "self";
  }

  return model.descendantIdsById.get(categoryId)?.has(targetParentId)
    ? "descendant"
    : null;
}
