"use client";

import { useCustomMutation, useDelete, useNotification } from "@refinedev/core";
import type { BaseRecord, HttpError } from "@refinedev/core";
import type { AdminUserDto } from "@tgp/contracts";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useMemo } from "react";

import {
  AdminGeneratedDetail,
  useAdminResourceDetail,
  type AdminDetailActionNotification,
  type AdminResourceDetailResult,
} from "../../../../platform/admin/detail";
import { toLocalizedAdminPath } from "../../../../platform/admin/navigation/adminLocalePaths";
import { getAdminIdentity } from "../../../../platform/admin/session/adminIdentityStore";
import { createUserDetailConfig } from "../user-admin.detail-config";
import type { AdminLocale } from "../types/user-admin.types";
import type {
  AdminUserDetailRecord,
  UserAdminDetailViewModel,
} from "../types/user-admin-detail.types";

interface UserDetailProps {
  id: string;
  locale: AdminLocale;
}

interface UserDetailViewProps {
  notify?: (notification: AdminDetailActionNotification) => void;
  redirect?: (href: string) => void;
  result: AdminResourceDetailResult<
    AdminUserDetailRecord & BaseRecord,
    UserAdminDetailViewModel
  >;
}

export function UserDetail({ id, locale }: UserDetailProps) {
  const identity = getAdminIdentity();
  const notification = useNotification();
  const router = useRouter();
  const t = useTranslations("Admin.Users");
  const tActions = useTranslations("Admin.Actions");
  const tDetail = useTranslations("Admin.Detail");
  const tStates = useTranslations("Admin.States");
  const deleteMutation = useDelete<
    AdminUserDetailRecord & BaseRecord,
    HttpError
  >();
  const stateMutation = useCustomMutation<
    AdminUserDto,
    HttpError,
    { active: boolean }
  >();
  const config = useMemo(
    () =>
      createUserDetailConfig({
        changeStateLoading: stateMutation.mutation.isPending,
        changeUserState: async (userId, nextActive) => {
          await stateMutation.mutateAsync({
            url: `/api/v1/admin/users/${userId}/status`,
            method: "patch",
            values: { active: nextActive },
          });
        },
        deleteLoading: deleteMutation.mutation.isPending,
        deleteUser: async (userId) => {
          await deleteMutation.mutateAsync({
            resource: "users",
            id: userId,
            mutationMode: "pessimistic",
          });
        },
        locale,
        t,
        tActions,
        tDetail,
        tStates,
      }),
    [
      deleteMutation,
      locale,
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
  });

  return (
    <UserDetailView
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
  );
}

export function UserDetailView({
  notify,
  redirect,
  result,
}: UserDetailViewProps) {
  return (
    <AdminGeneratedDetail
      result={result}
      notify={notify}
      redirect={redirect}
    />
  );
}
