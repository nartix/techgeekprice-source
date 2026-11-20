import type { AdminCategoryCapabilitiesDto } from "@tgp/contracts";

import type { CategoryCapabilitiesState } from "../types/category-admin.types";

export type TreePlacementMode =
  AdminCategoryCapabilitiesDto["placementModes"][number];

export type TreeVisibleOrderMode = "rank" | "fallback" | "unknown";

export function hasTreePlacementMode(
  state: CategoryCapabilitiesState,
  mode: TreePlacementMode,
): boolean {
  return (
    state.status === "ready" &&
    state.capabilities.ordering.placementModes.includes(mode)
  );
}

export function canAppendParentMove(state: CategoryCapabilitiesState): boolean {
  return hasTreePlacementMode(state, "APPEND");
}

export function canShowTreeManualOrderingControls(
  state: CategoryCapabilitiesState,
): boolean {
  return (
    state.status === "ready" &&
    state.capabilities.ordering.rankingEnabled &&
    state.capabilities.ordering.rankExposed
  );
}

export function getTreeVisibleOrderMode(
  state: CategoryCapabilitiesState,
): TreeVisibleOrderMode {
  if (state.status !== "ready") {
    return "unknown";
  }

  return state.capabilities.ordering.rankingEnabled &&
    state.capabilities.ordering.rankExposed
    ? "rank"
    : "fallback";
}
