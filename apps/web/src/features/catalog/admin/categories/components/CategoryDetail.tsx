"use client";

import { useCustomMutation, useDelete, useNotification } from "@refinedev/core";
import type { BaseRecord, HttpError } from "@refinedev/core";
import type { AdminCategoryDto } from "@tgp/contracts";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";

import { AdminForbidden } from "../../../../platform/admin/components/AdminForbidden";
import {
  AdminGeneratedDetail,
  useAdminResourceDetail,
  type AdminDetailActionNotification,
  type AdminResourceDetailResult,
} from "../../../../platform/admin/detail";
import { toLocalizedAdminPath } from "../../../../platform/admin/navigation/adminLocalePaths";
import { getAdminIdentity } from "../../../../platform/admin/session/adminIdentityStore";
import {
  createCategoryListingConfig,
  type AdminCategoryListingConfig,
} from "../admin-category-listing.config";
import { canPerformAdminAction } from "../../../../platform/admin/utils/adminPermissions";
import { createCategoryDetailConfig } from "../category-admin.detail-config";
import {
  CategorySystemRuntimeProvider,
  useCategorySystemRuntime,
} from "../category-system/CategorySystemRuntimeProvider";
import { catalogueCategorySystemDefinition } from "../category-system/catalogue-category-system.definition";
import { getCategoryOperationAvailability } from "../category-system/category-operation-permissions";
import { categoryParentIdToMutationValue } from "../mappers/category-admin.mapper";
import {
  CategoryMoveDialog,
  type CategoryMoveTarget,
} from "./CategoryMoveDialog";
import type { AdminLocale } from "../types/category-admin.types";
import type {
  AdminCategoryDetailRecord,
  CategoryAdminDetailViewModel,
} from "../types/category-admin-detail.types";

interface CategoryDetailProps {
  config: AdminCategoryListingConfig;
  id: string;
  locale: AdminLocale;
  runtimeProvided?: boolean;
}

interface CategoryDetailViewProps {
  notify?: (notification: AdminDetailActionNotification) => void;
  redirect?: (href: string) => void;
  result: AdminResourceDetailResult<
    AdminCategoryDetailRecord & BaseRecord,
    CategoryAdminDetailViewModel
  >;
}

export function ProductCategoryDetail({
  id,
  locale,
}: Omit<CategoryDetailProps, "config">) {
  return (
    <CategoryDetail
      config={createCategoryListingConfig(
        catalogueCategorySystemDefinition,
        "product-categories",
      )}
      id={id}
      locale={locale}
    />
  );
}

export function CategoryDetail({
  config: categoryConfig,
  id,
  locale,
  runtimeProvided = false,
}: CategoryDetailProps) {
  const identity = getAdminIdentity();
  const tStates = useTranslations("Admin.States");

  if (
    !canPerformAdminAction(identity, categoryConfig.permissionResource, "list")
  ) {
    return (
      <AdminForbidden
        title={tStates("forbiddenTitle")}
        message={tStates("forbiddenMessage")}
      />
    );
  }

  const content = (
    <CategoryDetailContent
      categoryConfig={categoryConfig}
      id={id}
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

function CategoryDetailContent({
  categoryConfig,
  id,
  identity,
  locale,
}: {
  readonly categoryConfig: AdminCategoryListingConfig;
  readonly id: string;
  readonly identity: ReturnType<typeof getAdminIdentity>;
  readonly locale: AdminLocale;
}) {
  const notification = useNotification();
  const router = useRouter();
  const t = useTranslations("Admin.ProductCategories");
  const tActions = useTranslations("Admin.Actions");
  const tDetail = useTranslations("Admin.Detail");
  const tStates = useTranslations("Admin.States");
  const [moveCategory, setMoveCategory] = useState<CategoryMoveTarget | null>(
    null,
  );
  const { capabilityState, definition, permissions } =
    useCategorySystemRuntime();
  const detailAvailability = getCategoryOperationAvailability({
    definition,
    capabilityState,
    identityPermissions: [...permissions],
    operation: "get",
    requireIdentifierProfile: "NUMERIC_LONG_V1",
    screen: "detail",
  });
  const deleteMutation = useDelete<
    AdminCategoryDetailRecord & BaseRecord,
    HttpError
  >();
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
  const isActionSupported = useCallback(
    (
      operation: "delete" | "move" | "activate" | "deactivate",
      active: boolean,
    ) =>
      getCategoryOperationAvailability({
        definition,
        capabilityState,
        identityPermissions: [...permissions],
        operation,
        recordState: active ? "ACTIVE" : "INACTIVE",
        requireHierarchyMutation: operation === "move" ? "move" : undefined,
        requireLifecycleAction:
          operation === "activate" || operation === "deactivate"
            ? operation
            : undefined,
        requireIdentifierProfile: "NUMERIC_LONG_V1",
        visible: true,
      }).usable,
    [capabilityState, definition, permissions],
  );

  const config = useMemo(
    () =>
      createCategoryDetailConfig({
        changeCategoryState: async (categoryId, nextActive) => {
          if (
            !isActionSupported(
              nextActive ? "activate" : "deactivate",
              !nextActive,
            )
          ) {
            return;
          }
          await stateMutation.mutateAsync({
            url: `${categoryConfig.apiBasePath}/${categoryId}/${nextActive ? "activate" : "deactivate"}`,
            method: "post",
            values: { active: nextActive },
          });
        },
        changeStateLoading: stateMutation.mutation.isPending,
        deleteCategory: async (categoryId) => {
          if (!isActionSupported("delete", true)) {
            return;
          }
          await deleteMutation.mutateAsync({
            resource: categoryConfig.resource,
            id: categoryId,
            mutationMode: "pessimistic",
          });
        },
        deleteLoading: deleteMutation.mutation.isPending,
        isActionSupported: (operation, record) =>
          isActionSupported(operation, record.active),
        moveLoading: moveMutation.mutation.isPending,
        openMoveDialog: (record) => {
          setMoveCategory({
            id: record.id,
            name: record.name,
            parentId: record.parentId,
          });
        },
        locale,
        config: categoryConfig,
        t,
        tActions,
        tDetail,
        tStates,
      }),
    [
      deleteMutation,
      categoryConfig,
      isActionSupported,
      locale,
      moveMutation,
      stateMutation,
      t,
      tActions,
      tDetail,
      tStates,
    ],
  );

  const result = useAdminResourceDetail({
    config,
    id,
    identity,
    locale,
    queryEnabled: detailAvailability.usable,
  });

  return (
    <>
      <CategoryDetailView
        result={result}
        notify={(item) => {
          notification.open?.({
            description: item.description,
            message: item.message,
            type: item.type ?? "success",
          });
        }}
        redirect={(href) => {
          router.push(toLocalizedAdminPath(locale, href));
        }}
      />
      <CategoryMoveDialog
        apiBasePath={categoryConfig.apiBasePath}
        category={moveCategory}
        loading={moveMutation.mutation.isPending}
        opened={moveCategory !== null}
        onClose={() => setMoveCategory(null)}
        onMove={async (newParentId) => {
          if (!moveCategory) {
            return;
          }

          await moveMutation.mutateAsync({
            url: `${categoryConfig.apiBasePath}/${moveCategory.id}/move`,
            method: "post",
            values: {
              newParentId: categoryParentIdToMutationValue(newParentId),
            },
          });
          notification.open?.({
            message: t("actions.moveSuccess"),
            type: "success",
          });
          setMoveCategory(null);
          await result.onRetry?.();
        }}
      />
    </>
  );
}

export function CategoryDetailView({
  notify,
  redirect,
  result,
}: CategoryDetailViewProps) {
  return (
    <AdminGeneratedDetail result={result} notify={notify} redirect={redirect} />
  );
}
