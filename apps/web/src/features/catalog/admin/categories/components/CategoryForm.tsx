"use client";

import { useTranslations } from "next-intl";
import { useMemo, type ReactNode } from "react";

import { AdminConflictAlert } from "../../../../platform/admin/components/AdminConflictAlert";
import { AdminForbidden } from "../../../../platform/admin/components/AdminForbidden";
import {
  AdminGeneratedForm,
  AdminGeneratedFormView,
  type AdminFormOptionLoaderApi,
} from "../../../../platform/admin/forms";
import { getAdminIdentity } from "../../../../platform/admin/session/adminIdentityStore";
import { canPerformAdminAction } from "../../../../platform/admin/utils/adminPermissions";
import {
  createCategoryListingConfig,
  type AdminCategoryListingConfig,
} from "../admin-category-listing.config";
import { createCategoryAdminFormConfig } from "../category-admin.form-config";
import {
  CategorySystemRuntimeProvider,
  useCategorySystemRuntime,
} from "../category-system/CategorySystemRuntimeProvider";
import { catalogueCategorySystemDefinition } from "../category-system/catalogue-category-system.definition";
import { getCategoryOperationAvailability } from "../category-system/category-operation-permissions";
import { emptyCategoryAdminFormValues } from "../mappers/category-admin.mapper";
import type {
  AdminLocale,
  CategoryAdminFormValues,
} from "../types/category-admin.types";

type CategoryFormMode = "create" | "edit";

interface CategoryFormProps {
  config: AdminCategoryListingConfig;
  id?: string;
  locale: AdminLocale;
  mode: CategoryFormMode;
  runtimeProvided?: boolean;
}

interface CategoryFormViewProps {
  api?: AdminFormOptionLoaderApi;
  config: AdminCategoryListingConfig;
  initialValues?: CategoryAdminFormValues;
  locale?: AdminLocale;
  mode: CategoryFormMode;
  loading?: boolean;
  formError?: string | null;
  successMessage?: string | null;
  conflict?: boolean;
  onReloadLatest?: () => void;
  onSubmit: (values: CategoryAdminFormValues) => Promise<void> | void;
}

export function ProductCategoryForm({
  id,
  locale,
  mode,
}: Omit<CategoryFormProps, "config">) {
  return (
    <CategoryForm
      config={createCategoryListingConfig(
        catalogueCategorySystemDefinition,
        "product-categories",
      )}
      id={id}
      locale={locale}
      mode={mode}
    />
  );
}

export function CategoryForm({
  config: categoryConfig,
  id,
  locale,
  mode,
  runtimeProvided = false,
}: CategoryFormProps) {
  const identity = getAdminIdentity();
  const canSubmit = canPerformAdminAction(
    identity,
    categoryConfig.permissionResource,
    mode,
  );
  if (!canSubmit) {
    return <CategoryFormAccessDenied />;
  }

  const content = (
    <CategoryFormContent
      categoryConfig={categoryConfig}
      id={id}
      identity={identity}
      locale={locale}
      mode={mode}
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

function CategoryFormContent({
  categoryConfig,
  id,
  identity,
  locale,
  mode,
}: {
  readonly categoryConfig: AdminCategoryListingConfig;
  readonly id?: string;
  readonly identity: ReturnType<typeof getAdminIdentity>;
  readonly locale: AdminLocale;
  readonly mode: CategoryFormMode;
}) {
  const t = useTranslations("Admin.ProductCategories");
  const tActions = useTranslations("Admin.Actions");
  const { capabilityState, definition, permissions } =
    useCategorySystemRuntime();
  const loadAvailability = getCategoryOperationAvailability({
    definition,
    capabilityState,
    identityPermissions: [...permissions],
    operation: "get",
    requireIdentifierProfile: "NUMERIC_LONG_V1",
    screen: "edit",
  });
  const submitAvailability = getCategoryOperationAvailability({
    definition,
    capabilityState,
    identityPermissions: [...permissions],
    operation: mode === "create" ? "create" : "patch",
    requireIdentifierProfile: "NUMERIC_LONG_V1",
    screen: mode,
  });
  const parentAvailability = getCategoryOperationAvailability({
    definition,
    capabilityState,
    identityPermissions: [...permissions],
    operation: "parent-options",
    requireHierarchyRead: "parent-options",
    requireIdentifierProfile: "NUMERIC_LONG_V1",
    screen: mode,
  });
  const formConfig = useMemo(
    () =>
      createCategoryAdminFormConfig(
        (key) => t(key as never),
        (key) => tActions(key as never),
        {
          config: categoryConfig,
          parentFieldEnabled: parentAvailability.usable,
        },
      ),
    [categoryConfig, parentAvailability.usable, t, tActions],
  );

  return (
    <AdminGeneratedForm
      action={mode}
      config={formConfig}
      id={id}
      loadEnabled={mode === "create" || loadAvailability.usable}
      locale={locale}
      permissions={identity?.permissions ?? []}
      resource={categoryConfig.resource}
      roles={identity?.roles ?? []}
      submitEnabled={submitAvailability.usable}
    />
  );
}

export function CategoryFormView({
  api,
  config: categoryConfig,
  initialValues = emptyCategoryAdminFormValues,
  locale = "en-CA",
  mode,
  loading = false,
  formError,
  successMessage,
  conflict = false,
  onReloadLatest,
  onSubmit,
}: CategoryFormViewProps) {
  const t = useTranslations("Admin.ProductCategories");
  const tActions = useTranslations("Admin.Actions");
  const formConfig = useMemo(
    () =>
      createCategoryAdminFormConfig(
        (key) => t(key as never),
        (key) => tActions(key as never),
        { config: categoryConfig },
      ),
    [categoryConfig, t, tActions],
  );

  return (
    <AdminGeneratedFormView
      action={mode}
      api={api}
      config={formConfig}
      disabled={loading}
      errorMessage={formError}
      initialValues={initialValues}
      loading={loading}
      locale={locale}
      successMessage={successMessage}
      topContent={renderConflict({
        conflict,
        message: t("conflict.message"),
        onReloadLatest,
        reloadLabel: tActions("reloadLatest"),
        title: t("conflict.title"),
      })}
      onSubmit={onSubmit}
    />
  );
}

function renderConflict(args: {
  conflict: boolean;
  message: string;
  onReloadLatest?: () => void;
  reloadLabel: string;
  title: string;
}): ReactNode {
  if (!args.conflict) {
    return null;
  }

  return (
    <AdminConflictAlert
      message={args.message}
      reloadLabel={args.reloadLabel}
      title={args.title}
      onReloadLatest={args.onReloadLatest ?? (() => undefined)}
    />
  );
}

function CategoryFormAccessDenied() {
  const tStates = useTranslations("Admin.States");

  return (
    <AdminForbidden
      title={tStates("forbiddenTitle")}
      message={tStates("forbiddenMessage")}
    />
  );
}
