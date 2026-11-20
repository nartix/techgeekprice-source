"use client";

import { useCustom } from "@refinedev/core";
import type { AdminCategoryCapabilitiesDto } from "@tgp/contracts";
import { useMemo } from "react";

import { normalizeAdminCategoryCapabilities } from "../category-system/category-capability-normalization";
import type {
  AdminCategoryCapabilityState,
  CategoryCapabilityIdentity,
} from "../category-system/category-system.types";

export const ADMIN_CATEGORY_SYSTEM_CAPABILITIES_QUERY_KEY = [
  "admin-category-system-capabilities",
] as const;

export interface UseAdminCategorySystemCapabilitiesOptions extends CategoryCapabilityIdentity {
  /**
   * A replacement generation issued by the runtime provider. It is deliberately
   * part of the query key: replacing authority must never reuse the previous
   * ready value while the new request is pending.
   */
  readonly refreshGeneration?: number;
}

export function createAdminCategorySystemCapabilitiesQueryKey(
  systemKey: string,
  apiBasePath: CategoryCapabilityIdentity["apiBasePath"],
  refreshGeneration = 0,
) {
  return [
    ...ADMIN_CATEGORY_SYSTEM_CAPABILITIES_QUERY_KEY,
    systemKey,
    apiBasePath,
    refreshGeneration,
  ] as const;
}

type CapabilityQueryRecord = AdminCategoryCapabilitiesDto &
  Record<string, unknown>;

function isValidCapabilityIdentity(
  systemKey: string,
  apiBasePath: CategoryCapabilityIdentity["apiBasePath"],
): boolean {
  return (
    systemKey.trim().length > 0 &&
    apiBasePath === `/api/v1/admin/category-systems/${systemKey}/categories`
  );
}

export function useAdminCategorySystemCapabilities({
  systemKey,
  apiBasePath,
  refreshGeneration = 0,
}: UseAdminCategorySystemCapabilitiesOptions): AdminCategoryCapabilityState {
  const identityIsValid = isValidCapabilityIdentity(systemKey, apiBasePath);
  const identity = useMemo(
    () => ({ systemKey, apiBasePath }),
    [apiBasePath, systemKey],
  );
  const capabilityQuery = useCustom<CapabilityQueryRecord>({
    url: `${apiBasePath}/capabilities`,
    method: "get",
    // Refine adds the query AbortSignal to this metadata before calling custom.
    // Keep this key explicit instead of relying on Refine's incidental metadata
    // serialization so a replacement cannot retain prior authority.
    meta: { refreshGeneration, systemKey },
    queryOptions: {
      enabled: identityIsValid,
      gcTime: Infinity,
      queryKey: createAdminCategorySystemCapabilitiesQueryKey(
        systemKey,
        apiBasePath,
        refreshGeneration,
      ),
      refetchOnMount: false,
      refetchOnReconnect: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
    },
  });

  return useMemo<AdminCategoryCapabilityState>(() => {
    if (!identityIsValid) {
      return { status: "loading", identity };
    }

    if (capabilityQuery.query.isError) {
      return {
        status: "error",
        identity,
        error: capabilityQuery.query.error,
      };
    }

    if (!capabilityQuery.query.isSuccess || !capabilityQuery.query.data) {
      return { status: "loading", identity };
    }

    const normalized = normalizeAdminCategoryCapabilities(
      capabilityQuery.query.data.data,
    );

    return normalized.ok
      ? { status: "ready", identity, capabilities: normalized.value }
      : { status: "error", identity, error: normalized.error };
  }, [
    capabilityQuery.query.data,
    capabilityQuery.query.error,
    capabilityQuery.query.isError,
    capabilityQuery.query.isSuccess,
    identity,
    identityIsValid,
  ]);
}
