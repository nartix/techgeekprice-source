"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { useAdminCategorySystemCapabilities } from "../hooks/useAdminCategorySystemCapabilities";
import { resolveCategoryOperationalLimit } from "./category-operational-limits";
import type { CategorySystemRuntime } from "./category-system-runtime.types";
import type { CategorySystemDefinition } from "./category-system.types";

const CategorySystemRuntimeContext =
  createContext<CategorySystemRuntime | null>(null);

export function CategorySystemRuntimeProvider({
  children,
  definition,
  identityPermissions,
}: {
  readonly children: ReactNode;
  readonly definition: CategorySystemDefinition<string>;
  readonly identityPermissions: readonly string[] | undefined;
}) {
  const [refreshGeneration, setRefreshGeneration] = useState(0);
  const capabilityState = useAdminCategorySystemCapabilities({
    systemKey: definition.systemKey,
    apiBasePath: definition.apiBasePath,
    refreshGeneration,
  });
  const refresh = useCallback(
    () => setRefreshGeneration((value) => value + 1),
    [],
  );
  const effectiveLimits = useMemo(
    () => ({
      parentOptionPageSize:
        capabilityState.status === "ready"
          ? resolveCategoryOperationalLimit(
              definition.preferredLimits.parentOptionPageSize,
              capabilityState.capabilities.limits.parentOptionPageSize,
            )
          : undefined,
      treeSize:
        capabilityState.status === "ready"
          ? resolveCategoryOperationalLimit(
              definition.preferredLimits.treeSize,
              capabilityState.capabilities.limits.treeSize,
            )
          : undefined,
    }),
    [
      capabilityState,
      definition.preferredLimits.parentOptionPageSize,
      definition.preferredLimits.treeSize,
    ],
  );
  const value = useMemo<CategorySystemRuntime>(
    () => ({
      definition,
      identity: capabilityState.identity,
      permissions: new Set(identityPermissions ?? []),
      capabilityState,
      effectiveLimits,
      refresh,
    }),
    [
      capabilityState,
      definition,
      effectiveLimits,
      identityPermissions,
      refresh,
    ],
  );

  return (
    <CategorySystemRuntimeContext.Provider value={value}>
      {children}
    </CategorySystemRuntimeContext.Provider>
  );
}

export function useCategorySystemRuntime(): CategorySystemRuntime {
  const runtime = useContext(CategorySystemRuntimeContext);

  if (!runtime) {
    throw new Error(
      "useCategorySystemRuntime must be used inside CategorySystemRuntimeProvider.",
    );
  }

  return runtime;
}
