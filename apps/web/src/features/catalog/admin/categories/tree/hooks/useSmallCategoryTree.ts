"use client";

import { useDataProvider } from "@refinedev/core";
import type { DataProvider } from "@refinedev/core";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  classifySmallCategoryTreeLoadError,
  type SmallCategoryTreeLoadError,
} from "../api/category-tree.errors";
import { loadSmallCategoryTree } from "../api/category-tree.api";
import {
  createSmallCategoryTreeModel,
  getInitialExpandedIds,
  type SmallCategoryTreeModel,
} from "../category-tree-model";
import {
  classifySmallCategoryTreeMoveError,
  submitAppendCategoryMove,
  type SmallCategoryTreeMoveError,
  type SmallCategoryTreeMoveErrorCode,
} from "../category-tree-mutations";
import type { AdminLocale } from "../../types/category-admin.types";

export type SmallCategoryTreeState =
  | { status: "loading" }
  | { status: "empty" }
  | { status: "ready"; model: SmallCategoryTreeModel }
  | { status: "refetching"; model: SmallCategoryTreeModel }
  | { status: "too-large"; error: SmallCategoryTreeLoadError }
  | { status: "unauthorized"; error: SmallCategoryTreeLoadError }
  | { status: "forbidden"; error: SmallCategoryTreeLoadError }
  | { status: "incomplete-response"; error: SmallCategoryTreeLoadError }
  | { status: "error"; error: SmallCategoryTreeLoadError };

export interface UseSmallCategoryTreeResult {
  expandedIds: Set<string>;
  model: SmallCategoryTreeModel | null;
  moveErrorCode: SmallCategoryTreeMoveErrorCode | null;
  moving: boolean;
  state: SmallCategoryTreeState;
  collapseAll: () => void;
  expandAll: () => void;
  moveCategory: (
    categoryId: string,
    newParentId: string | null,
  ) => Promise<void>;
  refresh: () => void;
  toggleRow: (rowId: string) => void;
}

interface UseSmallCategoryTreeOptions {
  apiBasePath?: string;
  /** Tree transport is fail-closed until the runtime gate is current and usable. */
  enabled?: boolean;
  /** Move transport is independently fail-closed from tree read authority. */
  moveEnabled?: boolean;
  treeSize?: number;
}

export function useSmallCategoryTree(
  locale: AdminLocale,
  options: UseSmallCategoryTreeOptions = {},
): UseSmallCategoryTreeResult {
  const getDataProvider = useDataProvider();
  const dataProvider = useMemo(
    () => getDataProvider() as DataProvider | undefined,
    [getDataProvider],
  );
  const [state, setState] = useState<SmallCategoryTreeState>({
    status: "loading",
  });
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [moving, setMoving] = useState(false);
  const [moveErrorCode, setMoveErrorCode] =
    useState<SmallCategoryTreeMoveErrorCode | null>(null);
  const latestRequestId = useRef(0);
  const abortController = useRef<AbortController | null>(null);
  const model =
    state.status === "ready" || state.status === "refetching"
      ? state.model
      : null;

  const loadTree = useCallback(
    (mode: "initial" | "refresh") => {
      if (!options.enabled) {
        return;
      }

      abortController.current?.abort();
      const controller = new AbortController();

      abortController.current = controller;
      const requestId = latestRequestId.current + 1;

      latestRequestId.current = requestId;
      setState((current) => {
        if (mode === "refresh" && "model" in current) {
          return { status: "refetching", model: current.model };
        }

        return { status: "loading" };
      });

      void loadSmallCategoryTree({
        apiBasePath: options.apiBasePath,
        dataProvider,
        signal: controller.signal,
        size: options.treeSize,
      })
        .then((response) => {
          if (
            controller.signal.aborted ||
            latestRequestId.current !== requestId
          ) {
            return;
          }

          const nextModel = createSmallCategoryTreeModel(response.data, locale);

          setExpandedIds(getInitialExpandedIds(nextModel));
          setState(
            nextModel.rows.length === 0
              ? { status: "empty" }
              : { status: "ready", model: nextModel },
          );
        })
        .catch((error: unknown) => {
          if (
            controller.signal.aborted ||
            latestRequestId.current !== requestId ||
            isAbortError(error)
          ) {
            return;
          }

          const classifiedError = classifySmallCategoryTreeLoadError(error);

          setState(
            classifiedError.code === "too-large"
              ? { status: "too-large", error: classifiedError }
              : classifiedError.code === "unauthorized"
                ? { status: "unauthorized", error: classifiedError }
                : classifiedError.code === "forbidden"
                  ? { status: "forbidden", error: classifiedError }
                  : classifiedError.code === "incomplete-tree-response"
                    ? { status: "incomplete-response", error: classifiedError }
                    : { status: "error", error: classifiedError },
          );
        });
    },
    [
      dataProvider,
      locale,
      options.apiBasePath,
      options.enabled,
      options.treeSize,
    ],
  );

  useEffect(() => {
    if (!options.enabled) {
      abortController.current?.abort();
      return;
    }

    loadTree("initial");

    return () => abortController.current?.abort();
  }, [loadTree, options.enabled]);

  const toggleRow = useCallback((rowId: string) => {
    setExpandedIds((current) => {
      const next = new Set(current);

      if (next.has(rowId)) {
        next.delete(rowId);
      } else {
        next.add(rowId);
      }

      return next;
    });
  }, []);

  const expandAll = useCallback(() => {
    setExpandedIds((current) =>
      model ? getInitialExpandedIds(model) : current,
    );
  }, [model]);

  const collapseAll = useCallback(() => {
    setExpandedIds(new Set());
  }, []);

  const refresh = useCallback(() => {
    loadTree("refresh");
  }, [loadTree]);

  const moveCategory = useCallback(
    async (categoryId: string, newParentId: string | null) => {
      if (!options.moveEnabled) {
        throw new Error("Category move is unavailable.");
      }

      setMoving(true);
      setMoveErrorCode(null);

      try {
        await submitAppendCategoryMove({
          apiBasePath: options.apiBasePath,
          categoryId,
          dataProvider,
          enabled: options.moveEnabled,
          newParentId,
        });
        loadTree("refresh");
      } catch (error: unknown) {
        const classifiedError: SmallCategoryTreeMoveError =
          classifySmallCategoryTreeMoveError(error);

        setMoveErrorCode(classifiedError.code);

        if (classifiedError.refreshTree) {
          loadTree("refresh");
        }

        throw classifiedError;
      } finally {
        setMoving(false);
      }
    },
    [dataProvider, loadTree, options.apiBasePath, options.moveEnabled],
  );

  return {
    expandedIds,
    model,
    moveErrorCode,
    moving,
    state,
    collapseAll,
    expandAll,
    moveCategory,
    refresh,
    toggleRow,
  };
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException
    ? error.name === "AbortError"
    : typeof error === "object" &&
        error !== null &&
        "name" in error &&
        error.name === "AbortError";
}
