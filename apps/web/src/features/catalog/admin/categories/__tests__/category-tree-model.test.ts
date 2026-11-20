import { describe, expect, it } from "vitest";

import {
  createSmallCategoryTreeModel,
  getInitialExpandedIds,
  getVisibleSmallCategoryTreeRows,
  isSmallCategoryTreeMoveTargetBlocked,
} from "../tree/category-tree-model";
import { categoryTreeItem, smallCategoryTree } from "./category-tree.fixtures";

describe("small category tree model", () => {
  it("preserves backend row order and normalizes nullable fields", () => {
    const rows = [
      categoryTreeItem({
        id: 20,
        name: "Second in natural sort",
        slug: "second",
        sortRank: undefined,
      }),
      categoryTreeItem({
        id: 10,
        name: "First in natural sort",
        slug: "first",
        sortRank: 1,
      }),
    ];
    const model = createSmallCategoryTreeModel(rows, "en-CA");

    expect(model.rows.map((row) => row.id)).toEqual(["20", "10"]);
    expect(model.rows[0]).toMatchObject({
      parentId: null,
      sortRank: null,
    });
  });

  it("expands all branch rows after successful load and hides descendants when collapsed", () => {
    const model = createSmallCategoryTreeModel(smallCategoryTree, "en-CA");
    const expandedIds = getInitialExpandedIds(model);

    expect([...expandedIds].sort()).toEqual(["1", "4"]);
    expect(getVisibleSmallCategoryTreeRows(model, expandedIds).map((row) => row.id))
      .toEqual(["1", "2", "3", "4", "5", "6"]);

    expandedIds.delete("1");

    expect(getVisibleSmallCategoryTreeRows(model, expandedIds).map((row) => row.id))
      .toEqual(["1", "4", "5", "6"]);
  });

  it("computes descendant sets for move safety", () => {
    const model = createSmallCategoryTreeModel(smallCategoryTree, "en-CA");

    expect([...model.descendantIdsById.get("1") ?? []].sort()).toEqual(["2", "3"]);
    expect(isSmallCategoryTreeMoveTargetBlocked(model, "1", "1")).toBe("self");
    expect(isSmallCategoryTreeMoveTargetBlocked(model, "1", "2")).toBe(
      "descendant",
    );
    expect(isSmallCategoryTreeMoveTargetBlocked(model, "1", "4")).toBeNull();
    expect(isSmallCategoryTreeMoveTargetBlocked(model, "1", null)).toBeNull();
  });

  it("handles empty trees", () => {
    const model = createSmallCategoryTreeModel([], "en-CA");

    expect(model.rows).toEqual([]);
    expect(getVisibleSmallCategoryTreeRows(model, new Set())).toEqual([]);
    expect(getInitialExpandedIds(model)).toEqual(new Set());
  });
});
