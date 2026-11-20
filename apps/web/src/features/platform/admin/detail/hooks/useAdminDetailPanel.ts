"use client";

import type { BaseRecord } from "@refinedev/core";
import { useEffect, useState } from "react";

import type {
  AdminCustomDetailPanel,
  AdminDetailBaseContext,
  AdminDetailPanel,
  AdminDetailPanelLabels,
  AdminDetailPanelState,
  AdminRelatedDetailPanel,
} from "../types/admin-detail.types";

interface UseAdminDetailPanelOptions<TRaw, TView> {
  context: AdminDetailBaseContext<TRaw, TView>;
  panel: AdminDetailPanel<TRaw, TView>;
}

interface AdminDetailPanelResult {
  data?: unknown;
  error: unknown;
  labels: AdminDetailPanelLabels;
  state: AdminDetailPanelState;
}

export function useAdminDetailPanel<TRaw, TView>({
  context,
  panel,
}: UseAdminDetailPanelOptions<TRaw, TView>): AdminDetailPanelResult {
  const [state, setState] = useState<AdminDetailPanelState>(() =>
    getInitialPanelState(panel, context),
  );
  const [data, setData] = useState<unknown>(undefined);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    let active = true;

    setError(null);

    if (isRelatedPanel(panel) && !panel.isSupported(context)) {
      setState("unsupported");
      setData(undefined);
      return () => {
        active = false;
      };
    }

    if (isRelatedPanel(panel)) {
      setState("empty");
      setData([]);
      return () => {
        active = false;
      };
    }

    if (!panel.load) {
      setState("ready");
      setData(undefined);
      return () => {
        active = false;
      };
    }

    setState("loading");

    Promise.resolve(panel.load(context))
      .then((nextData) => {
        if (!active) {
          return;
        }

        setData(nextData);
        setState(
          panel.isEmpty?.(nextData, { ...context, data: nextData })
            ? "empty"
            : "ready",
        );
      })
      .catch((nextError: unknown) => {
        if (!active) {
          return;
        }

        setError(nextError);
        setData(undefined);
        setState("error");
      });

    return () => {
      active = false;
    };
  }, [context, panel]);

  return {
    data,
    error,
    labels: panel.labels,
    state,
  };
}

function getInitialPanelState<TRaw, TView>(
  panel: AdminDetailPanel<TRaw, TView>,
  context: AdminDetailBaseContext<TRaw, TView>,
): AdminDetailPanelState {
  if (isRelatedPanel(panel)) {
    return panel.isSupported(context) ? "empty" : "unsupported";
  }

  return panel.load ? "loading" : "ready";
}

function isRelatedPanel<TRaw, TView>(
  panel: AdminDetailPanel<TRaw, TView>,
): panel is AdminRelatedDetailPanel<TRaw, TView, BaseRecord> {
  return "query" in panel;
}

export type { AdminCustomDetailPanel };
