import { useCallback, useEffect, useReducer, useRef, useState } from "react";

import {
  createCursorHierarchyPickerState,
  cursorHierarchyPickerReducer,
  selectCursorHierarchyPickerOptions,
} from "./cursor-hierarchy-picker.reducer";
import {
  CursorHierarchyInvalidResponseError,
  isValidCursorHierarchySlice,
} from "./cursor-hierarchy-picker.types";
import type {
  CursorHierarchyLoader,
  CursorHierarchyFailure,
  CursorHierarchyOption,
  CursorHierarchySliceAdapter,
} from "./cursor-hierarchy-picker.types";

export const CURSOR_HIERARCHY_SEARCH_DEBOUNCE_MS = 300;
const EMPTY_SELECTED: readonly CursorHierarchyOption[] = [];

export function useCursorHierarchyOptions({
  adaptSlice,
  enabled,
  loader,
  root,
  selected = EMPTY_SELECTED,
  selectedIds: selectedIdsOverride,
  contextKey = "",
  validateSearch = () => true,
}: {
  readonly adaptSlice: CursorHierarchySliceAdapter;
  readonly enabled: boolean;
  readonly loader: CursorHierarchyLoader;
  readonly root?: CursorHierarchyOption | null;
  readonly selected?: readonly CursorHierarchyOption[];
  /** Values that must be included in a domain loader even before hydration. */
  readonly selectedIds?: readonly string[];
  /** Changes invalidate prior cursors and prevent their responses winning. */
  readonly contextKey?: string;
  readonly validateSearch?: (search: string) => boolean;
}) {
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<CursorHierarchyFailure | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasResolvedFirstSlice, setHasResolvedFirstSlice] = useState(false);
  const [state, dispatch] = useReducer(
    cursorHierarchyPickerReducer,
    { root, selected },
    createCursorHierarchyPickerState,
  );
  const controller = useRef<AbortController | null>(null);
  const epoch = useRef(0);
  const stateRef = useRef(state);
  const recoveryAttempted = useRef(false);
  const selectedKey = JSON.stringify(
    selected.map((option) => [
      option.id,
      option.label,
      Boolean(option.disabled),
    ]),
  );
  const selectedIds = selectedIdsOverride ?? JSON.parse(selectedKey).map(
    ([id]: [string, string, boolean]) => id,
  ) as string[];
  const rootKey = root
    ? `${root.id}\u0000${root.label}\u0000${root.disabled ? "1" : "0"}`
    : "";
  const rootRef = useRef(root);
  const selectedRef = useRef(selected);
  const selectedIdsRef = useRef(selectedIds);
  rootRef.current = root;
  selectedRef.current = selected;
  selectedIdsRef.current = selectedIds;
  stateRef.current = state;

  const startFirstSlice = useCallback(
    (rawSearch: string) => {
      const requestEpoch = epoch.current + 1;
      epoch.current = requestEpoch;
      controller.current?.abort();
      const nextController = new AbortController();
      controller.current = nextController;
      setHasResolvedFirstSlice(false);
      setLoading(true);
      setError(null);

      void loader(
        { search: rawSearch.trim(), selectedIds },
        null,
        nextController.signal,
      )
        .then((value) => {
          if (nextController.signal.aborted || epoch.current !== requestEpoch)
            return;
          const slice = adaptSlice(value);
          if (!isValidCursorHierarchySlice(slice)) {
            setError({
              code: "invalid-response",
              cause: value,
              retryable: true,
            });
            return;
          }
          dispatch({ type: "first-slice-loaded", ...slice });
          setHasResolvedFirstSlice(true);
        })
        .catch((cause: unknown) => {
          if (
            !nextController.signal.aborted &&
            epoch.current === requestEpoch
          ) {
            setError(toCursorHierarchyFailure(cause));
          }
        })
        .finally(() => {
          if (epoch.current === requestEpoch) setLoading(false);
        });
    },
    [adaptSlice, loader, selectedIds],
  );

  useEffect(() => {
    const selectedIdSet = new Set(selectedIdsRef.current);
    const retainedSelected = selectCursorHierarchyPickerOptions(stateRef.current)
      .filter((option) => selectedIdSet.has(option.id));

    controller.current?.abort();
    epoch.current += 1;
    recoveryAttempted.current = false;
    setHasResolvedFirstSlice(false);
    dispatch({
      type: "reset",
      root: rootRef.current ?? null,
      selected: [...selectedRef.current, ...retainedSelected],
    });
  }, [contextKey, rootKey]);

  useEffect(() => {
    if (!enabled || !validateSearch(search)) {
      controller.current?.abort();
      setLoading(false);
      return;
    }

    const timeout = window.setTimeout(() => {
      startFirstSlice(search);
    }, CURSOR_HIERARCHY_SEARCH_DEBOUNCE_MS);

    return () => window.clearTimeout(timeout);
  }, [contextKey, enabled, search, startFirstSlice, validateSearch]);

  useEffect(() => () => controller.current?.abort(), []);

  const loadMore = useCallback(() => {
    const current = stateRef.current;
    const cursor = current.nextCursor;
    if (
      !enabled ||
      loadingMore ||
      !current.hasMore ||
      !cursor ||
      current.continuationBlocked ||
      !validateSearch(search)
    )
      return;

    const requestEpoch = epoch.current + 1;
    epoch.current = requestEpoch;
    controller.current?.abort();
    const nextController = new AbortController();
    controller.current = nextController;
    setLoadingMore(true);
    setError(null);
    void loader(
      { search: search.trim(), selectedIds },
      cursor,
      nextController.signal,
    )
      .then((value) => {
        if (nextController.signal.aborted || epoch.current !== requestEpoch)
          return;
        const slice = adaptSlice(value);
        const nextCursor = slice.nextCursor?.trim() ?? "";
        const invalid =
          !isValidCursorHierarchySlice(slice) ||
          (slice.hasMore &&
            (!nextCursor || current.seenCursors.includes(nextCursor)));
        if (invalid) {
          dispatch({ type: "invalid-continuation" });
          if (!recoveryAttempted.current) {
            recoveryAttempted.current = true;
            startFirstSlice(search);
          } else {
            setError({
              code: "invalid-continuation",
              cause: value,
              retryable: false,
            });
          }
          return;
        }
        dispatch({ type: "continuation-loaded", ...slice });
      })
      .catch((cause: unknown) => {
        if (!nextController.signal.aborted && epoch.current === requestEpoch) {
          if (cause instanceof CursorHierarchyInvalidResponseError) {
            dispatch({ type: "invalid-continuation" });
            if (!recoveryAttempted.current) {
              recoveryAttempted.current = true;
              startFirstSlice(search);
            } else {
              setError({ code: "invalid-continuation", cause, retryable: false });
            }
          } else {
            dispatch({ type: "continuation-conflict" });
            setError({ code: "continuation-conflict", cause, retryable: true });
          }
        }
      })
      .finally(() => {
        if (epoch.current === requestEpoch) setLoadingMore(false);
      });
  }, [
    adaptSlice,
    enabled,
    loader,
    loadingMore,
    search,
    selectedIds,
    startFirstSlice,
    validateSearch,
  ]);

  const retry = useCallback(() => {
    if (enabled && validateSearch(search)) startFirstSlice(search);
  }, [enabled, search, startFirstSlice, validateSearch]);

  return {
    error,
    hasResolvedFirstSlice,
    loading,
    loadingMore,
    loadMore,
    options: selectCursorHierarchyPickerOptions(state),
    search,
    setSearch,
    state,
    retry,
  };
}

function toCursorHierarchyFailure(cause: unknown): CursorHierarchyFailure {
  if (cause instanceof CursorHierarchyInvalidResponseError) {
    return { code: "invalid-response", cause, retryable: false };
  }

  return { code: "load-failed", cause, retryable: true };
}
