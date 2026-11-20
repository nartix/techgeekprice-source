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
import { emptyUserAdminFormValues } from "../mappers/user-admin.mapper";
import { createUserAdminFormConfig } from "../user-admin.form-config";
import type {
  AdminLocale,
  UserAdminFormValues,
} from "../types/user-admin.types";

type UserFormMode = "create" | "edit";

interface UserFormProps {
  id?: string;
  locale: AdminLocale;
  mode: UserFormMode;
}

interface UserFormViewProps {
  api?: AdminFormOptionLoaderApi;
  initialValues?: UserAdminFormValues;
  locale?: AdminLocale;
  mode: UserFormMode;
  loading?: boolean;
  formError?: string | null;
  successMessage?: string | null;
  conflict?: boolean;
  onReloadLatest?: () => void;
  onSubmit: (values: UserAdminFormValues) => Promise<void> | void;
}

export function UserForm({ id, locale, mode }: UserFormProps) {
  const identity = getAdminIdentity();
  const canSubmit = canPerformAdminAction(identity, "users", mode);
  const t = useTranslations("Admin.Users");
  const tActions = useTranslations("Admin.Actions");
  const config = useMemo(
    () =>
      createUserAdminFormConfig(
        (key) => t(key as never),
        (key) => tActions(key as never),
      ),
    [t, tActions],
  );

  if (!canSubmit) {
    return <UserFormAccessDenied />;
  }

  return (
    <AdminGeneratedForm
      action={mode}
      config={config}
      id={id}
      locale={locale}
      permissions={identity?.permissions ?? []}
      resource="users"
      roles={identity?.roles ?? []}
    />
  );
}

export function UserFormView({
  api,
  initialValues = emptyUserAdminFormValues,
  locale = "en-CA",
  mode,
  loading = false,
  formError,
  successMessage,
  conflict = false,
  onReloadLatest,
  onSubmit,
}: UserFormViewProps) {
  const t = useTranslations("Admin.Users");
  const tActions = useTranslations("Admin.Actions");
  const config = useMemo(
    () =>
      createUserAdminFormConfig(
        (key) => t(key as never),
        (key) => tActions(key as never),
      ),
    [t, tActions],
  );

  return (
    <AdminGeneratedFormView
      action={mode}
      api={api}
      config={config}
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

function UserFormAccessDenied() {
  const tStates = useTranslations("Admin.States");

  return (
    <AdminForbidden
      title={tStates("forbiddenTitle")}
      message={tStates("forbiddenMessage")}
    />
  );
}
