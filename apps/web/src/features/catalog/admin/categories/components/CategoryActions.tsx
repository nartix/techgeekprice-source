"use client";

import { ActionIcon, Loader, Menu, Tooltip } from "@mantine/core";
import {
  useCustomMutation,
  useDelete,
  useInvalidate,
  useNotification,
} from "@refinedev/core";
import { IconDotsVertical } from "@tabler/icons-react";
import type { BaseRecord, HttpError } from "@refinedev/core";
import type { AdminCategoryDto } from "@tgp/contracts";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Link } from "../../../../../i18n/navigation";
import { AdminConfirmDialog } from "../../../../platform/admin/components/AdminConfirmDialog";
import { toLocalizedAdminPath } from "../../../../platform/admin/navigation/adminLocalePaths";
import { getAdminIdentity } from "../../../../platform/admin/session/adminIdentityStore";
import type { AdminIdentity } from "../../../../platform/admin/types/admin.types";
import { canPerformAdminAction } from "../../../../platform/admin/utils/adminPermissions";
import type { AdminCategoryListingResource } from "../admin-category-listing.config";
import { categoryParentIdToMutationValue } from "../mappers/category-admin.mapper";
import { CategoryMoveDialog } from "./CategoryMoveDialog";
import type {
  AdminLocale,
  CategoryActionRecord,
} from "../types/category-admin.types";

export interface CategoryActionGate {
  readonly visible: boolean;
  readonly disabled?: boolean;
}

export interface CategoryActionGates {
  readonly view?: CategoryActionGate;
  readonly edit?: CategoryActionGate;
  readonly delete?: CategoryActionGate;
  readonly move?: CategoryActionGate;
  readonly activate?: CategoryActionGate;
  readonly deactivate?: CategoryActionGate;
}

interface CategoryActionsProps {
  apiBasePath: string;
  category: CategoryActionRecord;
  deleteSuccessMessage?: string;
  identity?: AdminIdentity | null;
  locale: AdminLocale;
  onDeleteSuccess?: () => void;
  onMoveSuccess?: (newParentId: string | null) => void;
  onStateChangeSuccess?: (nextActive: boolean) => void;
  stateSuccessMessage?: string | ((nextActive: boolean) => string);
  stateActionsAvailable?: boolean;
  moveActionsAvailable?: boolean;
  resource: AdminCategoryListingResource;
  permissionResource: AdminCategoryListingResource;
  listHref: string;
  editHref?: string;
  viewHref?: string;
  /** Category-owned exact operation gates. Omit to retain legacy callers. */
  actionGates?: CategoryActionGates;
}

interface CategoryActionsViewProps
  extends Omit<CategoryActionsProps, "apiBasePath" | "listHref" | "resource"> {
  deleteLoading?: boolean;
  moveLoading?: boolean;
  stateLoading?: boolean;
  onDelete?: (categoryId: string) => Promise<void> | void;
  onMoveRequest?: () => void;
  onStateChange?: (
    categoryId: string,
    nextActive: boolean,
  ) => Promise<void> | void;
}

type PendingAction = "delete" | "state" | null;

export function CategoryActions({
  apiBasePath,
  actionGates,
  category,
  deleteSuccessMessage,
  identity = getAdminIdentity(),
  locale,
  onDeleteSuccess,
  onMoveSuccess,
  onStateChangeSuccess,
  stateSuccessMessage,
  stateActionsAvailable = true,
  moveActionsAvailable = false,
  resource,
  permissionResource,
  listHref,
  editHref,
  viewHref,
}: CategoryActionsProps) {
  const router = useRouter();
  const invalidate = useInvalidate();
  const notification = useNotification();
  const t = useTranslations("Admin.ProductCategories.actions");
  const deleteMutation = useDelete<AdminCategoryDto>();
  const moveMutation = useCustomMutation<
    BaseRecord,
    HttpError,
    { newParentId: number | null }
  >();
  const stateMutation = useCustomMutation<
    AdminCategoryDto,
    HttpError,
    { active: boolean }
  >();
  const [moveDialogOpened, setMoveDialogOpened] = useState(false);

  return (
    <>
      <CategoryActionsView
        category={category}
        actionGates={actionGates}
        identity={identity}
        locale={locale}
        moveActionsAvailable={moveActionsAvailable}
        permissionResource={permissionResource}
        stateActionsAvailable={stateActionsAvailable}
        editHref={editHref}
        viewHref={viewHref}
        deleteLoading={deleteMutation.mutation.isPending}
        moveLoading={moveMutation.mutation.isPending}
        stateLoading={stateMutation.mutation.isPending}
        onDelete={async (categoryId) => {
          await deleteMutation.mutateAsync({
            resource,
            id: categoryId,
            mutationMode: "pessimistic",
          });
          if (deleteSuccessMessage) {
            notification.open?.({
              message: deleteSuccessMessage,
              type: "success",
            });
          }
          onDeleteSuccess?.();
          router.push(toLocalizedAdminPath(locale, listHref));
        }}
        onMoveRequest={() => setMoveDialogOpened(true)}
        onStateChange={async (categoryId, nextActive) => {
          await stateMutation.mutateAsync({
            url: `${apiBasePath}/${categoryId}/${nextActive ? "activate" : "deactivate"}`,
            method: "post",
            values: { active: nextActive },
          });
          if (stateSuccessMessage) {
            notification.open?.({
              message:
                typeof stateSuccessMessage === "function"
                  ? stateSuccessMessage(nextActive)
                  : stateSuccessMessage,
              type: "success",
            });
          }
          onStateChangeSuccess?.(nextActive);
        }}
      />
      <CategoryMoveDialog
        apiBasePath={apiBasePath}
        category={category}
        loading={moveMutation.mutation.isPending}
        opened={moveDialogOpened}
        onClose={() => setMoveDialogOpened(false)}
        onMove={async (newParentId) => {
          await moveMutation.mutateAsync({
            url: `${apiBasePath}/${category.id}/move`,
            method: "post",
            values: {
              newParentId: categoryParentIdToMutationValue(newParentId),
            },
          });
          notification.open?.({
            message: t("moveSuccess"),
            type: "success",
          });
          setMoveDialogOpened(false);
          await invalidate({
            resource,
            invalidates: ["list"],
          });
          onMoveSuccess?.(newParentId);
        }}
      />
    </>
  );
}

export function CategoryActionsView({
  actionGates,
  category,
  identity,
  locale,
  stateActionsAvailable = true,
  moveActionsAvailable = false,
  permissionResource,
  editHref,
  viewHref,
  deleteLoading = false,
  moveLoading = false,
  stateLoading = false,
  onDelete,
  onDeleteSuccess,
  onMoveRequest,
  onStateChange,
  onStateChangeSuccess,
}: CategoryActionsViewProps) {
  const t = useTranslations("Admin.ProductCategories.actions");
  const tAdmin = useTranslations("Admin.Actions");
  const canShow = canPerformAdminAction(identity, permissionResource, "show");
  const canEdit = canPerformAdminAction(identity, permissionResource, "edit");
  const canDelete = canPerformAdminAction(identity, permissionResource, "delete");
  const canChangeState = canPerformAdminAction(
    identity,
    permissionResource,
    "state",
  );
  const canMove = canPerformAdminAction(identity, permissionResource, "move");
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [localLoading, setLocalLoading] = useState(false);
  const nextActive = !category.active;
  const actionLoading = localLoading || deleteLoading || stateLoading;
  const stateGate = category.active
    ? actionGates?.deactivate
    : actionGates?.activate;
  const showView = Boolean(viewHref && (actionGates?.view?.visible ?? canShow));
  const showEdit = Boolean(editHref && (actionGates?.edit?.visible ?? canEdit));
  const showMove = Boolean(onMoveRequest) && (actionGates?.move?.visible ?? (moveActionsAvailable && canMove));
  const showState = stateGate?.visible ?? (stateActionsAvailable && canChangeState);
  const showDelete = actionGates?.delete?.visible ?? canDelete;
  const hasNavigationActions = showView || showEdit;
  const hasWorkflowActions = showMove || showState;
  const triggerLabel = t("moreFor", { name: category.name });

  if (!showView && !showEdit && !showMove && !showState && !showDelete) {
    return null;
  }

  async function handleConfirm() {
    if (!pendingAction) {
      return;
    }

    setLocalLoading(true);

    try {
      if (pendingAction === "delete") {
        await onDelete?.(category.id);
        onDeleteSuccess?.();
      }

      if (pendingAction === "state") {
        await onStateChange?.(category.id, nextActive);
        onStateChangeSuccess?.(nextActive);
      }

      setPendingAction(null);
    } finally {
      setLocalLoading(false);
    }
  }

  return (
    <>
      <Menu loop position="bottom-end" shadow="md" width={224} withinPortal>
        <Menu.Target>
          <Tooltip
            events={{ focus: true, hover: true, touch: false }}
            label={triggerLabel}
            withArrow
          >
            <ActionIcon
              aria-label={triggerLabel}
              radius="md"
              size="lg"
              title={triggerLabel}
              variant="subtle"
            >
              <IconDotsVertical aria-hidden="true" size={18} />
            </ActionIcon>
          </Tooltip>
        </Menu.Target>
        <Menu.Dropdown>
          {showView && viewHref ? (
            actionGates?.view?.disabled ? (
              <Menu.Item disabled>{t("show")}</Menu.Item>
            ) : (
              <Menu.Item component={Link} href={viewHref} locale={locale}>
                {t("show")}
              </Menu.Item>
            )
          ) : null}
          {showEdit && editHref ? (
            actionGates?.edit?.disabled ? (
              <Menu.Item disabled>{tAdmin("edit")}</Menu.Item>
            ) : (
              <Menu.Item component={Link} href={editHref} locale={locale}>
                {tAdmin("edit")}
              </Menu.Item>
            )
          ) : null}
          {hasNavigationActions && hasWorkflowActions ? <Menu.Divider /> : null}
          {showMove ? (
            <Menu.Item
              disabled={moveLoading || actionGates?.move?.disabled}
              leftSection={moveLoading ? <Loader size="xs" /> : null}
              onClick={onMoveRequest}
            >
              {t("move")}
            </Menu.Item>
          ) : null}
          {showState ? (
            <Menu.Item
              color={category.active ? "orange" : "green"}
              disabled={localLoading || stateLoading || stateGate?.disabled}
              leftSection={
                localLoading || stateLoading ? <Loader size="xs" /> : null
              }
              onClick={() => setPendingAction("state")}
            >
              {category.active ? t("deactivate") : t("activate")}
            </Menu.Item>
          ) : null}
          {(hasNavigationActions || hasWorkflowActions) && showDelete ? (
            <Menu.Divider />
          ) : null}
          {showDelete ? (
            <Menu.Item
              color="red"
              disabled={localLoading || deleteLoading || actionGates?.delete?.disabled}
              leftSection={
                localLoading || deleteLoading ? <Loader size="xs" /> : null
              }
              onClick={() => setPendingAction("delete")}
            >
              {tAdmin("delete")}
            </Menu.Item>
          ) : null}
        </Menu.Dropdown>
      </Menu>
      <AdminConfirmDialog
        opened={pendingAction !== null}
        title={pendingAction === "delete" ? t("deleteTitle") : t("stateTitle")}
        message={
          pendingAction === "delete"
            ? t("deleteMessage", { name: category.name })
            : t("stateMessage", { name: category.name })
        }
        confirmLabel={tAdmin("confirm")}
        cancelLabel={tAdmin("cancel")}
        destructive={pendingAction === "delete" || category.active}
        loading={actionLoading}
        onCancel={() => setPendingAction(null)}
        onConfirm={() => {
          void handleConfirm();
        }}
      />
    </>
  );
}
