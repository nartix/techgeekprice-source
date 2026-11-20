"use client";

import { Stack } from "@mantine/core";
import {
  useCustomMutation,
  useDataProvider,
  useDelete,
  useNotification,
  type DataProvider,
  type HttpError,
} from "@refinedev/core";
import type { AdminCategoryDto } from "@tgp/contracts";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";

import { AdminForbidden } from "../../../../../platform/admin/components/AdminForbidden";
import {
  createAdminFormOptionLoaderApi,
  type AdminFormOptionLoaderApi,
} from "../../../../../platform/admin/forms";
import { getAdminIdentity } from "../../../../../platform/admin/session/adminIdentityStore";
import type { AdminIdentity } from "../../../../../platform/admin/types/admin.types";
import { canPerformAdminAction } from "../../../../../platform/admin/utils/adminPermissions";
import {
  createCategoryListingConfig,
  type AdminCategoryListingConfig,
} from "../../admin-category-listing.config";
import {
  CategorySystemRuntimeProvider,
  useCategorySystemRuntime,
} from "../../category-system/CategorySystemRuntimeProvider";
import { catalogueCategorySystemDefinition } from "../../category-system/catalogue-category-system.definition";
import { getCategoryOperationAvailability } from "../../category-system/category-operation-permissions";
import type {
  AdminLocale,
  CategoryCapabilitiesState,
} from "../../types/category-admin.types";
import {
  getInitialExpandedIds,
  type SmallCategoryTreeModel,
  type SmallCategoryTreeRow,
} from "../category-tree-model";
import { canAppendParentMove } from "../category-tree-capabilities";
import type { SmallCategoryTreeMoveErrorCode } from "../category-tree-mutations";
import {
  useSmallCategoryTree,
  type SmallCategoryTreeState,
} from "../hooks/useSmallCategoryTree";

import { SmallCategoryTreeMoveDialog } from "./SmallCategoryTreeMoveDialog";
import { SmallCategoryTreeState as SmallCategoryTreeStatePanel } from "./SmallCategoryTreeState";
import { SmallCategoryTreeTable } from "./SmallCategoryTreeTable";
import { SmallCategoryTreeToolbar } from "./SmallCategoryTreeToolbar";

interface SmallCategoryTreePageProps {
  config: AdminCategoryListingConfig;
  locale: AdminLocale;
  runtimeProvided?: boolean;
}

interface SmallCategoryTreePageContentProps {
  config: AdminCategoryListingConfig;
  identity: AdminIdentity | null;
  locale: AdminLocale;
}

export interface SmallCategoryTreePageViewProps {
  canActivate: boolean;
  canDeactivate: boolean;
  canMove: boolean;
  capabilitiesState: CategoryCapabilitiesState;
  deleteLoading: boolean;
  expandedIds: Set<string>;
  identity: AdminIdentity | null;
  listHref: string;
  locale: AdminLocale;
  model: SmallCategoryTreeModel | null;
  moveDialogApi?: AdminFormOptionLoaderApi;
  moveDialogApiBasePath?: string;
  moving: boolean;
  moveErrorCode: SmallCategoryTreeMoveErrorCode | null;
  selectedMoveRow: SmallCategoryTreeRow | null;
  stateLoading: boolean;
  treeActionsEnabled?: boolean;
  permissionResource: AdminCategoryListingConfig["permissionResource"];
  showHref: AdminCategoryListingConfig["showHref"];
  editHref: AdminCategoryListingConfig["editHref"];
  treeState: SmallCategoryTreeState;
  onCloseMoveDialog: () => void;
  onCollapseAll: () => void;
  onDeleteRow: (row: SmallCategoryTreeRow) => Promise<void> | void;
  onExpandAll: () => void;
  onMoveRow: (row: SmallCategoryTreeRow) => void;
  onRefresh: () => void;
  onStateChangeRow: (
    row: SmallCategoryTreeRow,
    nextActive: boolean,
  ) => Promise<void> | void;
  onSubmitMove: (newParentId: string | null) => void | Promise<void>;
  onToggleRow: (rowId: string) => void;
}

export function ProductCategoryTreePage({
  locale,
}: Omit<SmallCategoryTreePageProps, "config">) {
  return (
    <SmallCategoryTreePage
      config={createCategoryListingConfig(
        catalogueCategorySystemDefinition,
        "product-categories",
      )}
      locale={locale}
    />
  );
}

export function SmallCategoryTreePage({
  config,
  locale,
  runtimeProvided = false,
}: SmallCategoryTreePageProps) {
  const identity = getAdminIdentity();
  const tStates = useTranslations("Admin.States");

  if (!canPerformAdminAction(identity, config.permissionResource, "list")) {
    return (
      <AdminForbidden
        title={tStates("forbiddenTitle")}
        message={tStates("forbiddenMessage")}
      />
    );
  }

  const content = (
    <SmallCategoryTreePageContent
      config={config}
      identity={identity}
      locale={locale}
    />
  );

  return runtimeProvided ? (
    content
  ) : (
    <CategorySystemRuntimeProvider
      definition={catalogueCategorySystemDefinition}
      identityPermissions={identity?.permissions}
    >
      {content}
    </CategorySystemRuntimeProvider>
  );
}

function SmallCategoryTreePageContent({
  config,
  identity,
  locale,
}: SmallCategoryTreePageContentProps) {
  const t = useTranslations("Admin.ProductCategories.tree");
  const getDataProvider = useDataProvider();
  const dataProvider = useMemo(
    () => getDataProvider() as DataProvider | undefined,
    [getDataProvider],
  );
  const moveDialogApi = useMemo(
    () => createAdminFormOptionLoaderApi(dataProvider),
    [dataProvider],
  );
  const notification = useNotification();
  const tActions = useTranslations("Admin.ProductCategories.actions");
  const {
    capabilityState: capabilitiesState,
    definition,
    effectiveLimits,
    permissions,
    refresh: refreshCapabilities,
  } = useCategorySystemRuntime();
  const treeAvailability = getCategoryOperationAvailability({
    definition,
    capabilityState: capabilitiesState,
    identityPermissions: [...permissions],
    operation: "tree",
    requireHierarchyRead: "tree",
    requireIdentifierProfile: "NUMERIC_LONG_V1",
    screen: "tree",
    visible: true,
  });
  const moveAvailability = getCategoryOperationAvailability({
    definition,
    capabilityState: capabilitiesState,
    identityPermissions: [...permissions],
    operation: "move",
    requireHierarchyMutation: "move",
    requireIdentifierProfile: "NUMERIC_LONG_V1",
    visible: true,
  });
  const activateAvailability = getCategoryOperationAvailability({
    definition,
    capabilityState: capabilitiesState,
    identityPermissions: [...permissions],
    operation: "activate",
    requireLifecycleAction: "activate",
    visible: true,
  });
  const deactivateAvailability = getCategoryOperationAvailability({
    definition,
    capabilityState: capabilitiesState,
    identityPermissions: [...permissions],
    operation: "deactivate",
    requireLifecycleAction: "deactivate",
    visible: true,
  });
  const tree = useSmallCategoryTree(locale, {
    apiBasePath: config.apiBasePath,
    enabled: treeAvailability.usable,
    moveEnabled:
      moveAvailability.usable && canAppendParentMove(capabilitiesState),
    treeSize: effectiveLimits.treeSize,
  });
  const [selectedMoveRow, setSelectedMoveRow] =
    useState<SmallCategoryTreeRow | null>(null);
  const deleteMutation = useDelete<AdminCategoryDto>();
  const stateMutation = useCustomMutation<
    AdminCategoryDto,
    HttpError,
    { active: boolean }
  >();
  const canActivate = activateAvailability.usable;
  const canDeactivate = deactivateAvailability.usable;
  const canMove =
    moveAvailability.usable && canAppendParentMove(capabilitiesState);

  return (
    <SmallCategoryTreePageView
      canActivate={canActivate}
      canDeactivate={canDeactivate}
      canMove={canMove}
      capabilitiesState={capabilitiesState}
      deleteLoading={deleteMutation.mutation.isPending}
      expandedIds={tree.expandedIds}
      identity={identity}
      listHref={config.listHref}
      locale={locale}
      model={tree.model}
      moveDialogApi={moveDialogApi}
      moveDialogApiBasePath={config.apiBasePath}
      moving={tree.moving}
      moveErrorCode={tree.moveErrorCode}
      permissionResource={config.permissionResource}
      selectedMoveRow={selectedMoveRow}
      showHref={config.showHref}
      editHref={config.editHref}
      stateLoading={stateMutation.mutation.isPending}
      treeActionsEnabled={treeAvailability.usable}
      treeState={tree.state}
      onCloseMoveDialog={() => setSelectedMoveRow(null)}
      onCollapseAll={tree.collapseAll}
      onDeleteRow={async (row) => {
        await deleteMutation.mutateAsync({
          resource: config.resource,
          id: row.id,
          mutationMode: "pessimistic",
        });
        notification.open?.({
          message: tActions("deleteSuccess"),
          type: "success",
        });
      }}
      onExpandAll={tree.expandAll}
      onMoveRow={setSelectedMoveRow}
      onRefresh={tree.refresh}
      onStateChangeRow={async (row, nextActive) => {
        const lifecycleAvailability = getCategoryOperationAvailability({
          definition,
          capabilityState: capabilitiesState,
          identityPermissions: [...permissions],
          operation: nextActive ? "activate" : "deactivate",
          recordState: row.active ? "ACTIVE" : "INACTIVE",
          requireLifecycleAction: nextActive ? "activate" : "deactivate",
          visible: true,
        });

        if (!lifecycleAvailability.usable) {
          throw new Error("Category lifecycle action is unavailable.");
        }

        await stateMutation.mutateAsync({
          url: `${config.apiBasePath}/${row.id}/${nextActive ? "activate" : "deactivate"}`,
          method: "post",
          values: { active: nextActive },
        });
        notification.open?.({
          message: nextActive
            ? tActions("activateSuccess")
            : tActions("deactivateSuccess"),
          type: "success",
        });
      }}
      onSubmitMove={async (newParentId) => {
        if (!selectedMoveRow) {
          return;
        }

        try {
          await tree.moveCategory(selectedMoveRow.id, newParentId);
          notification.open?.({
            message: t("move.success"),
            type: "success",
          });
          setSelectedMoveRow(null);
        } catch (error: unknown) {
          if (shouldRefreshCapabilities(error)) {
            refreshCapabilities();
          }

          notification.open?.({
            message: getMoveErrorMessage(
              t,
              getMoveErrorCode(error) ?? tree.moveErrorCode ?? "genericError",
            ),
            type: "error",
          });
          throw error;
        }
      }}
      onToggleRow={tree.toggleRow}
    />
  );
}

export function SmallCategoryTreePageView({
  canActivate,
  canDeactivate,
  canMove,
  capabilitiesState,
  deleteLoading,
  expandedIds,
  identity,
  listHref,
  locale,
  model,
  moveDialogApi,
  moveDialogApiBasePath,
  treeState,
  moving,
  moveErrorCode,
  permissionResource,
  selectedMoveRow,
  showHref,
  editHref,
  stateLoading,
  treeActionsEnabled,
  onCloseMoveDialog,
  onCollapseAll,
  onDeleteRow,
  onExpandAll,
  onMoveRow,
  onRefresh,
  onStateChangeRow,
  onSubmitMove,
  onToggleRow,
}: SmallCategoryTreePageViewProps) {
  const displayModel =
    treeState.status === "ready" || treeState.status === "refetching"
      ? treeState.model
      : model;
  const [localExpandedIds, setLocalExpandedIds] =
    useState<Set<string>>(expandedIds);
  const [localSelectedMoveRow, setLocalSelectedMoveRow] =
    useState<SmallCategoryTreeRow | null>(selectedMoveRow);
  const showRank =
    capabilitiesState.status === "ready" &&
    capabilitiesState.capabilities.ordering.rankingEnabled &&
    capabilitiesState.capabilities.ordering.rankExposed;
  const moveAvailable =
    canMove &&
    capabilitiesState.status === "ready" &&
    capabilitiesState.capabilities.hierarchy.enabled &&
    capabilitiesState.capabilities.hierarchy.mutationOperations.includes(
      "move",
    ) &&
    capabilitiesState.capabilities.ordering.placementModes.includes("APPEND");
  const derivedTreeActionsAvailable =
    capabilitiesState.status === "ready" &&
    capabilitiesState.capabilities.supportedOperations.includes("tree") &&
    capabilitiesState.capabilities.hierarchy.enabled &&
    capabilitiesState.capabilities.hierarchy.readOperations.includes("tree");
  const treeActionsAvailable =
    treeActionsEnabled ?? derivedTreeActionsAvailable;

  useEffect(() => {
    setLocalExpandedIds(expandedIds);
  }, [expandedIds]);

  useEffect(() => {
    setLocalSelectedMoveRow(selectedMoveRow);
  }, [selectedMoveRow]);

  const handleToggleRow = (rowId: string) => {
    setLocalExpandedIds((current) => {
      const next = new Set(current);

      if (next.has(rowId)) {
        next.delete(rowId);
      } else {
        next.add(rowId);
      }

      return next;
    });
    onToggleRow(rowId);
  };
  const handleExpandAll = () => {
    if (displayModel) {
      setLocalExpandedIds(getInitialExpandedIds(displayModel));
    }

    onExpandAll();
  };
  const handleCollapseAll = () => {
    setLocalExpandedIds(new Set());
    onCollapseAll();
  };
  const handleMoveRow = (row: SmallCategoryTreeRow) => {
    setLocalSelectedMoveRow(row);
    onMoveRow(row);
  };
  const handleActionSuccess = () => {
    onRefresh();
  };
  const handleCloseMoveDialog = () => {
    setLocalSelectedMoveRow(null);
    onCloseMoveDialog();
  };
  const handleSubmitMove = async (newParentId: string | null) => {
    try {
      await onSubmitMove(newParentId);
      setLocalSelectedMoveRow(null);
      onCloseMoveDialog();
    } catch {
      return;
    }
  };
  const table = displayModel ? (
    <SmallCategoryTreeTable
      actionsEnabled={treeActionsAvailable}
      canActivate={canActivate}
      canDeactivate={canDeactivate}
      canMove={moveAvailable}
      deleteLoading={deleteLoading}
      expandedIds={localExpandedIds}
      identity={identity}
      locale={locale}
      model={displayModel}
      moveLoading={moving}
      permissionResource={permissionResource}
      showRank={showRank}
      showHref={showHref}
      editHref={editHref}
      stateLoading={stateLoading}
      onActionSuccess={handleActionSuccess}
      onDeleteRow={onDeleteRow}
      onMoveRow={handleMoveRow}
      onStateChangeRow={onStateChangeRow}
      onToggleRow={handleToggleRow}
    />
  ) : null;

  return (
    <Stack gap="xs" data-density="compact">
      <SmallCategoryTreeToolbar
        capabilitiesState={capabilitiesState}
        isRefreshing={treeState.status === "refetching"}
        listHref={listHref}
        locale={locale}
        onCollapseAll={handleCollapseAll}
        onExpandAll={handleExpandAll}
        onRefresh={onRefresh}
      />
      {treeState.status === "ready" || treeState.status === "refetching" ? (
        <>
          {table}
          {displayModel && moveDialogApi ? (
            <SmallCategoryTreeMoveDialog
              api={moveDialogApi}
              apiBasePath={moveDialogApiBasePath}
              category={localSelectedMoveRow}
              enabled={moveAvailable}
              loading={moving}
              model={displayModel}
              moveErrorCode={moveErrorCode}
              opened={Boolean(localSelectedMoveRow)}
              onClose={handleCloseMoveDialog}
              onMove={handleSubmitMove}
            />
          ) : null}
        </>
      ) : (
        <SmallCategoryTreeStatePanel
          listHref={listHref}
          locale={locale}
          state={treeState}
          onRetry={onRefresh}
        />
      )}
    </Stack>
  );
}

function getMoveErrorCode(
  error: unknown,
): SmallCategoryTreeMoveErrorCode | null {
  return typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof error.code === "string"
    ? (error.code as SmallCategoryTreeMoveErrorCode)
    : null;
}

function shouldRefreshCapabilities(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "refreshCapabilities" in error &&
    error.refreshCapabilities === true
  );
}

function getMoveErrorMessage(
  t: ReturnType<typeof useTranslations>,
  code: SmallCategoryTreeMoveErrorCode,
): string {
  switch (code) {
    case "stale":
      return t("move.stale");
    case "unsupportedPlacement":
      return t("move.unsupportedPlacement");
    case "invalidPlacementTarget":
      return t("move.invalidPlacementTarget");
    case "rankRebalanceRejected":
      return t("move.rankRebalanceRejected");
    case "categoryNotFound":
      return t("move.categoryNotFound");
    case "validationFailed":
      return t("move.validationFailed");
    case "unauthorized":
      return t("move.unauthorized");
    case "forbidden":
      return t("move.forbidden");
    case "genericError":
      return t("move.genericError");
  }
}
