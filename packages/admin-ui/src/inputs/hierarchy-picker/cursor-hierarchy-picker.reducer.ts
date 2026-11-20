import type { CursorHierarchyOption } from "./cursor-hierarchy-picker.types";

export interface CursorHierarchyPickerState {
  readonly root: CursorHierarchyOption | null;
  readonly selected: readonly CursorHierarchyOption[];
  readonly remote: readonly CursorHierarchyOption[];
  readonly hasMore: boolean;
  readonly nextCursor: string | null;
  readonly seenCursors: readonly string[];
  readonly continuationBlocked: boolean;
  readonly recovery: "none" | "retry-first-slice" | "exhausted";
}

export type CursorHierarchyPickerAction =
  | {
      readonly type: "reset";
      readonly root: CursorHierarchyOption | null;
      readonly selected: readonly CursorHierarchyOption[];
    }
  | {
      readonly type: "first-slice-loaded";
      readonly options: readonly CursorHierarchyOption[];
      readonly hasMore: boolean;
      readonly nextCursor: string | null;
    }
  | {
      readonly type: "continuation-loaded";
      readonly options: readonly CursorHierarchyOption[];
      readonly hasMore: boolean;
      readonly nextCursor: string | null;
    }
  | { readonly type: "continuation-conflict" }
  | { readonly type: "invalid-continuation" };

export function createCursorHierarchyPickerState({
  root = null,
  selected = [],
}: {
  readonly root?: CursorHierarchyOption | null;
  readonly selected?: readonly CursorHierarchyOption[];
}): CursorHierarchyPickerState {
  return {
    root,
    selected,
    remote: [],
    hasMore: false,
    nextCursor: null,
    seenCursors: [],
    continuationBlocked: false,
    recovery: "none",
  };
}

export function cursorHierarchyPickerReducer(
  state: CursorHierarchyPickerState,
  action: CursorHierarchyPickerAction,
): CursorHierarchyPickerState {
  switch (action.type) {
    case "reset":
      return createCursorHierarchyPickerState(action);
    case "first-slice-loaded":
      return applySlice(state, action, action.options);
    case "continuation-loaded":
      return applySlice(state, action, [...state.remote, ...action.options]);
    case "continuation-conflict":
      return {
        ...state,
        continuationBlocked: true,
        hasMore: false,
        nextCursor: null,
      };
    case "invalid-continuation":
      return state.recovery === "none"
        ? {
            ...state,
            recovery: "retry-first-slice",
            hasMore: false,
            nextCursor: null,
          }
        : {
            ...state,
            recovery: "exhausted",
            continuationBlocked: true,
            hasMore: false,
            nextCursor: null,
          };
  }
}

export function selectCursorHierarchyPickerOptions(
  state: CursorHierarchyPickerState,
): CursorHierarchyOption[] {
  return uniqueOptions([
    ...(state.root ? [state.root] : []),
    ...state.selected,
    ...state.remote,
  ]);
}

function applySlice(
  state: CursorHierarchyPickerState,
  slice: Extract<
    CursorHierarchyPickerAction,
    { type: "first-slice-loaded" | "continuation-loaded" }
  >,
  remote: readonly CursorHierarchyOption[],
): CursorHierarchyPickerState {
  const nextCursor = normalizeCursor(slice.nextCursor);
  const validContinuation =
    !slice.hasMore ||
    (nextCursor !== null && !state.seenCursors.includes(nextCursor));

  if (!validContinuation) {
    return cursorHierarchyPickerReducer(state, {
      type: "invalid-continuation",
    });
  }

  return {
    ...state,
    remote: uniqueOptions(remote),
    hasMore: slice.hasMore,
    nextCursor,
    seenCursors: nextCursor
      ? [...state.seenCursors, nextCursor]
      : state.seenCursors,
    continuationBlocked: false,
    recovery: "none",
  };
}

function normalizeCursor(value: string | null): string | null {
  const normalized = value?.trim() ?? "";
  return normalized.length > 0 ? normalized : null;
}

function uniqueOptions(
  options: readonly CursorHierarchyOption[],
): CursorHierarchyOption[] {
  const seen = new Set<string>();

  return options.filter((option) => {
    if (seen.has(option.id)) return false;
    seen.add(option.id);
    return true;
  });
}
