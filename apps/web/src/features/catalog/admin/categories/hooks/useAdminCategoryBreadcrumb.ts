"use client";

import { useDataProvider } from "@refinedev/core";
import type { DataProvider } from "@refinedev/core";
import type { AdminCategoryBreadcrumbItemDto } from "@tgp/contracts";
import { useEffect, useMemo, useState } from "react";

import { isAdminDetailNotFoundError } from "../../../../platform/admin/detail/utils/adminDetailErrors";
import type { CategoryBreadcrumbState } from "../types/category-admin.types";

const DEFAULT_CATEGORY_API_BASE_PATH =
  "/api/v1/admin/category-systems/catalogue/categories";

export const ADMIN_CATEGORY_BREADCRUMB_QUERY_KEY_PREFIX = [
  "admin",
  "categories",
  "breadcrumb",
] as const;

interface UseAdminCategoryBreadcrumbOptions {
  apiBasePath?: string;
  /** Defaults to true; a capability gate can suppress the request safely. */
  enabled?: boolean;
}

export function createAdminCategoryBreadcrumbQueryKey(
  parentId: number,
  apiBasePath = DEFAULT_CATEGORY_API_BASE_PATH,
) {
  if (apiBasePath === DEFAULT_CATEGORY_API_BASE_PATH) {
    return [...ADMIN_CATEGORY_BREADCRUMB_QUERY_KEY_PREFIX, parentId] as const;
  }

  return [
    ...ADMIN_CATEGORY_BREADCRUMB_QUERY_KEY_PREFIX,
    apiBasePath,
    parentId,
  ] as const;
}

export function useAdminCategoryBreadcrumb(
  parentId: number | null,
  options: UseAdminCategoryBreadcrumbOptions = {},
): CategoryBreadcrumbState {
  const apiBasePath = options.apiBasePath ?? DEFAULT_CATEGORY_API_BASE_PATH;
  const getDataProvider = useDataProvider();
  const dataProvider = useMemo(
    () => getDataProvider() as DataProvider | undefined,
    [getDataProvider],
  );
  const enabled =
    options.enabled !== false && typeof parentId === "number" && parentId > 0;
  const [state, setState] = useState<CategoryBreadcrumbState>(
    enabled ? { status: "loading" } : { status: "idle" },
  );

  useEffect(() => {
    let active = true;

    if (!enabled || parentId == null) {
      setState({ status: "idle" });
      return;
    }

    setState({ status: "loading" });

    if (!dataProvider?.custom) {
      setState({
        status: "error",
        error: new Error("Admin data provider is unavailable."),
      });
      return;
    }

    void dataProvider
      .custom<AdminCategoryBreadcrumbItemDto[]>({
        url: `${apiBasePath}/${parentId}/breadcrumb`,
        method: "get",
      })
      .then((response) => {
        if (active) {
          setState({ status: "ready", items: response.data });
        }
      })
      .catch((error: unknown) => {
        if (!active) {
          return;
        }

        setState(
          isAdminDetailNotFoundError(error)
            ? { status: "not-found", error }
            : { status: "error", error },
        );
      });

    return () => {
      active = false;
    };
  }, [apiBasePath, dataProvider, enabled, parentId]);

  return state;
}
