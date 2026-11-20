import type {
  AdminCategoryIdentifierProfile,
  AdminCategoryOperation,
} from "@tgp/contracts";

import type {
  AdminCategoryCapabilityState,
  CategorySystemDefinition,
} from "./category-system.types";

export type CategoryOperationUnavailableReason =
  | "unauthenticated"
  | "definition-missing"
  | "missing-permission"
  | "screen-disabled"
  | "hidden"
  | "undeclared"
  | "not-ready"
  | "identity-mismatch"
  | "unsupported"
  | "missing-hierarchy-facet"
  | "missing-lifecycle-facet"
  | "missing-ordering-facet"
  | "identifier-profile-mismatch"
  | "record-state";

export type CategoryOperationAvailability =
  | { readonly usable: true }
  | {
      readonly usable: false;
      readonly reason: CategoryOperationUnavailableReason;
    };

interface CategoryOperationAvailabilityInput {
  readonly definition: CategorySystemDefinition<string> | undefined;
  readonly capabilityState: AdminCategoryCapabilityState;
  /** Authentication is evaluated before any capability-specific reason. */
  readonly authenticated?: boolean;
  readonly identityPermissions: readonly string[] | undefined;
  readonly operation: AdminCategoryOperation;
  readonly screen?: keyof CategorySystemDefinition<string>["screens"];
  readonly visible?: boolean;
  readonly requireHierarchyRead?: AdminCategoryOperation;
  readonly requireHierarchyMutation?: AdminCategoryOperation;
  readonly requireLifecycleAction?: "activate" | "deactivate";
  readonly requireOrdering?: "ranking-enabled" | "rank-exposed";
  readonly requireIdentifierProfile?: AdminCategoryIdentifierProfile;
  readonly recordState?: "ACTIVE" | "INACTIVE";
}

/**
 * Derives a single fail-closed operation result from immutable configuration,
 * current identity, and normalized current capability data. This is the only
 * operation authority; callers add no local permission or support fallbacks.
 */
export function getCategoryOperationAvailability({
  definition,
  capabilityState,
  authenticated = true,
  identityPermissions,
  operation,
  screen,
  visible = false,
  requireHierarchyRead,
  requireHierarchyMutation,
  requireLifecycleAction,
  requireOrdering,
  requireIdentifierProfile,
  recordState,
}: CategoryOperationAvailabilityInput): CategoryOperationAvailability {
  if (!authenticated) return { usable: false, reason: "unauthenticated" };
  if (!definition) return { usable: false, reason: "definition-missing" };

  const permission = definition.operationPermissions[operation];
  if (!permission || !identityPermissions?.includes(permission)) {
    return { usable: false, reason: "missing-permission" };
  }
  if (screen && !definition.screens[screen]) {
    return { usable: false, reason: "screen-disabled" };
  }
  if (!definition.declaredOperations.includes(operation)) {
    return { usable: false, reason: "undeclared" };
  }
  if (visible && !definition.visibleOperations.includes(operation)) {
    return { usable: false, reason: "hidden" };
  }
  if (capabilityState.status !== "ready") {
    return { usable: false, reason: "not-ready" };
  }
  if (
    capabilityState.identity.systemKey !== definition.systemKey ||
    capabilityState.identity.apiBasePath !== definition.apiBasePath
  ) {
    return { usable: false, reason: "identity-mismatch" };
  }
  if (!capabilityState.capabilities.supportedOperations.includes(operation)) {
    return { usable: false, reason: "unsupported" };
  }
  if (
    (requireHierarchyRead &&
      (!capabilityState.capabilities.hierarchy.enabled ||
        !capabilityState.capabilities.hierarchy.readOperations.includes(
          requireHierarchyRead,
        ))) ||
    (requireHierarchyMutation &&
      (!capabilityState.capabilities.hierarchy.enabled ||
        !capabilityState.capabilities.hierarchy.mutationOperations.includes(
          requireHierarchyMutation,
        )))
  ) {
    return { usable: false, reason: "missing-hierarchy-facet" };
  }
  if (
    requireLifecycleAction &&
    (!capabilityState.capabilities.lifecycle.enabled ||
      !capabilityState.capabilities.lifecycle.actions.includes(
        requireLifecycleAction,
      ))
  ) {
    return { usable: false, reason: "missing-lifecycle-facet" };
  }
  if (
    requireOrdering === "ranking-enabled" &&
    !capabilityState.capabilities.ordering.rankingEnabled
  ) {
    return { usable: false, reason: "missing-ordering-facet" };
  }
  if (
    requireOrdering === "rank-exposed" &&
    (!capabilityState.capabilities.ordering.rankingEnabled ||
      !capabilityState.capabilities.ordering.rankExposed)
  ) {
    return { usable: false, reason: "missing-ordering-facet" };
  }
  if (
    requireIdentifierProfile &&
    definition.identifierProfile !== requireIdentifierProfile
  ) {
    return { usable: false, reason: "identifier-profile-mismatch" };
  }
  if (
    recordState &&
    ((requireLifecycleAction === "activate" && recordState !== "INACTIVE") ||
      (requireLifecycleAction === "deactivate" && recordState !== "ACTIVE"))
  ) {
    return { usable: false, reason: "record-state" };
  }

  return { usable: true };
}

export function isCategoryOperationUsable(
  input: Pick<
    CategoryOperationAvailabilityInput,
    | "definition"
    | "capabilityState"
    | "authenticated"
    | "identityPermissions"
    | "operation"
  >,
): boolean {
  return getCategoryOperationAvailability(input).usable;
}
