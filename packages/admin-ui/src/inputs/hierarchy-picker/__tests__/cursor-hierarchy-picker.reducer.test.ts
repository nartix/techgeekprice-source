import { describe, expect, it } from "vitest";

import {
  createCursorHierarchyPickerState,
  cursorHierarchyPickerReducer,
  selectCursorHierarchyPickerOptions,
} from "../cursor-hierarchy-picker.reducer.js";

const root = { id: "__root__", label: "No parent", source: "root" } as const;
const selected = { id: "42", label: "Selected", source: "selected" } as const;

describe("cursorHierarchyPickerReducer", () => {
  it("keeps root and selected options stable while replacing the first remote slice", () => {
    const initial = createCursorHierarchyPickerState({
      root,
      selected: [selected],
    });
    const state = cursorHierarchyPickerReducer(initial, {
      type: "first-slice-loaded",
      options: [
        { id: "42", label: "Duplicate selected", source: "remote" },
        { id: "9", label: "Remote", source: "remote" },
      ],
      hasMore: true,
      nextCursor: "cursor-2",
    });

    expect(selectCursorHierarchyPickerOptions(state)).toEqual([
      root,
      selected,
      { id: "9", label: "Remote", source: "remote" },
    ]);
    expect(state.seenCursors).toEqual(["cursor-2"]);
  });

  it("starts a fresh cursor history when reopening a paginated list", () => {
    const firstPage = {
      type: "first-slice-loaded",
      options: [selected],
      hasMore: true,
      nextCursor: "1",
    } as const;
    const first = cursorHierarchyPickerReducer(
      createCursorHierarchyPickerState({ root }),
      firstPage,
    );
    const reopened = cursorHierarchyPickerReducer(first, firstPage);
    expect(reopened).toEqual(first);

    const loop = cursorHierarchyPickerReducer(reopened, {
      ...firstPage,
      type: "continuation-loaded",
    });
    expect(loop.hasMore).toBe(false);
    expect(loop.recovery).toBe("retry-first-slice");
  });

  it("retains ordinary options and blocks continuation after an unrecognized cursor conflict", () => {
    const initial = cursorHierarchyPickerReducer(
      createCursorHierarchyPickerState({ root }),
      {
        type: "first-slice-loaded",
        options: [{ id: "9", label: "Remote", source: "remote" }],
        hasMore: true,
        nextCursor: "cursor-2",
      },
    );
    const conflicted = cursorHierarchyPickerReducer(initial, {
      type: "continuation-conflict",
    });

    expect(selectCursorHierarchyPickerOptions(conflicted)).toEqual([
      root,
      { id: "9", label: "Remote", source: "remote" },
    ]);
    expect(conflicted.continuationBlocked).toBe(true);
    expect(conflicted.hasMore).toBe(false);
  });

  it("permits one same-context recovery and then exhausts invalid continuation recovery", () => {
    const first = cursorHierarchyPickerReducer(
      createCursorHierarchyPickerState({ root }),
      { type: "invalid-continuation" },
    );
    const second = cursorHierarchyPickerReducer(first, {
      type: "invalid-continuation",
    });

    expect(first.recovery).toBe("retry-first-slice");
    expect(second.recovery).toBe("exhausted");
  });
});
