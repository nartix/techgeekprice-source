import { Badge, Text } from "@mantine/core";
import type { BaseRecord } from "@refinedev/core";
import type { useTranslations } from "next-intl";

import {
  adminDetailAction,
  defineAdminDetailConfig,
  detailField,
  detailSection,
  type AdminDetailDefinition,
} from "../../../platform/admin/detail";
import type { AdminDetailLocale } from "../../../platform/admin/detail";
import { mapUserDtoToDetailViewModel } from "./mappers/user-admin-detail.mapper";
import type {
  AdminUserDetailRecord,
  UserAdminDetailViewModel,
} from "./types/user-admin-detail.types";

type AdminTranslator = ReturnType<typeof useTranslations>;

interface CreateUserDetailConfigOptions {
  changeStateLoading?: boolean;
  changeUserState?: (id: string, nextActive: boolean) => Promise<void>;
  deleteLoading?: boolean;
  deleteUser: (id: string) => Promise<void>;
  locale: AdminDetailLocale;
  t: AdminTranslator;
  tActions: AdminTranslator;
  tDetail: AdminTranslator;
  tStates: AdminTranslator;
}

export function createUserDetailConfig({
  changeStateLoading = false,
  changeUserState,
  deleteLoading = false,
  deleteUser,
  locale,
  t,
  tActions,
  tDetail,
  tStates,
}: CreateUserDetailConfigOptions): AdminDetailDefinition<
  AdminUserDetailRecord & BaseRecord,
  UserAdminDetailViewModel
> {
  return defineAdminDetailConfig<
    AdminUserDetailRecord & BaseRecord,
    UserAdminDetailViewModel
  >({
    resource: "users",
    labels: {
      loading: t("form.loading"),
      forbiddenTitle: tStates("forbiddenTitle"),
      forbiddenMessage: tStates("forbiddenMessage"),
      invalidTitle: tDetail("invalidTitle"),
      invalidMessage: tDetail("invalidMessage"),
      notFoundTitle: tDetail("notFoundTitle"),
      notFoundMessage: tDetail("notFoundMessage"),
      errorTitle: tStates("errorTitle"),
      errorMessage: tStates("errorMessage"),
      emptyTitle: tDetail("emptyTitle"),
      emptyMessage: tDetail("emptyMessage"),
      retry: tStates("retry"),
    },
    title: ({ record }) => record.username,
    description: ({ record }) => record.email,
    transformRecord: (record) => mapUserDtoToDetailViewModel(record, locale),
    sections: [
      detailSection<AdminUserDetailRecord & BaseRecord, UserAdminDetailViewModel>(
        {
          id: "account",
          title: t("sections.account"),
          fields: [
            detailField<
              AdminUserDetailRecord & BaseRecord,
              UserAdminDetailViewModel,
              "displayName"
            >({
              id: "displayName",
              label: t("fields.displayName"),
              valueKey: "displayName",
              emptyFallback: t("list.notProvided"),
            }),
            detailField<
              AdminUserDetailRecord & BaseRecord,
              UserAdminDetailViewModel,
              "active"
            >({
              id: "status",
              label: t("fields.status"),
              valueKey: "active",
              safeRenderer: true,
              sensitive: true,
              sensitiveKind: "account-state",
              render: ({ record }) => (
                <Badge color={record.active ? "green" : "gray"} variant="light">
                  {record.active ? t("status.active") : t("status.inactive")}
                </Badge>
              ),
            }),
            detailField<
              AdminUserDetailRecord & BaseRecord,
              UserAdminDetailViewModel,
              "createdAtLabel"
            >({
              id: "createdAt",
              label: t("fields.createdAt"),
              valueKey: "createdAtLabel",
            }),
            detailField<
              AdminUserDetailRecord & BaseRecord,
              UserAdminDetailViewModel,
              "updatedAtLabel"
            >({
              id: "updatedAt",
              label: t("fields.updatedAt"),
              valueKey: "updatedAtLabel",
            }),
          ],
        },
      ),
      detailSection<AdminUserDetailRecord & BaseRecord, UserAdminDetailViewModel>(
        {
          id: "access",
          title: t("sections.access"),
          description: t("sections.accessDescription"),
          fields: [
            detailField<
              AdminUserDetailRecord & BaseRecord,
              UserAdminDetailViewModel,
              "rolesLabel"
            >({
              id: "roles",
              label: t("fields.roles"),
              valueKey: "rolesLabel",
              emptyFallback: t("list.notProvided"),
              safeRenderer: true,
              sensitive: true,
              sensitiveKind: "roles",
              render: ({ value }) => (
                <Text>{String(value || t("list.notProvided"))}</Text>
              ),
            }),
            detailField<
              AdminUserDetailRecord & BaseRecord,
              UserAdminDetailViewModel,
              "permissionsLabel"
            >({
              id: "permissions",
              label: t("fields.permissions"),
              valueKey: "permissionsLabel",
              emptyFallback: t("list.notProvided"),
              safeRenderer: true,
              sensitive: true,
              sensitiveKind: "permissions",
              render: ({ value }) => (
                <Text>{String(value || t("list.notProvided"))}</Text>
              ),
            }),
          ],
        },
      ),
    ],
    actions: [
      adminDetailAction<
        AdminUserDetailRecord & BaseRecord,
        UserAdminDetailViewModel
      >({
        id: "back",
        kind: "navigation",
        href: "/admin/users",
        label: t("show.backToList"),
      }),
      adminDetailAction<
        AdminUserDetailRecord & BaseRecord,
        UserAdminDetailViewModel
      >({
        id: "edit",
        kind: "navigation",
        href: ({ record }) => `/admin/users/${record.id}/edit`,
        label: tActions("edit"),
        resourceAction: "edit",
      }),
      adminDetailAction<
        AdminUserDetailRecord & BaseRecord,
        UserAdminDetailViewModel
      >({
        id: "activate",
        kind: "mutation",
        label: t("actions.activate"),
        color: "green",
        variant: "light",
        loading: changeStateLoading,
        resourceAction: "state",
        visibleWhen: ({ record }) => !record.active,
        isSupported: () => Boolean(changeUserState),
        confirmation: ({ record }) => ({
          title: t("actions.stateTitle"),
          message: t("actions.stateMessage", { username: record.username }),
          confirmLabel: tActions("confirm"),
          cancelLabel: tActions("cancel"),
        }),
        onClick: async ({ notify, record, refetch }) => {
          if (!changeUserState) {
            return;
          }

          await changeUserState(record.id, true);
          notify?.({
            message: t("actions.activateSuccess"),
            type: "success",
          });
          await refetch?.();
        },
      }),
      adminDetailAction<
        AdminUserDetailRecord & BaseRecord,
        UserAdminDetailViewModel
      >({
        id: "deactivate",
        kind: "mutation",
        label: t("actions.deactivate"),
        color: "orange",
        variant: "light",
        loading: changeStateLoading,
        resourceAction: "state",
        visibleWhen: ({ record }) => record.active,
        isSupported: () => Boolean(changeUserState),
        confirmation: ({ record }) => ({
          title: t("actions.stateTitle"),
          message: t("actions.stateMessage", { username: record.username }),
          confirmLabel: tActions("confirm"),
          cancelLabel: tActions("cancel"),
          destructive: true,
        }),
        onClick: async ({ notify, record, refetch }) => {
          if (!changeUserState) {
            return;
          }

          await changeUserState(record.id, false);
          notify?.({
            message: t("actions.deactivateSuccess"),
            type: "success",
          });
          await refetch?.();
        },
      }),
      adminDetailAction<
        AdminUserDetailRecord & BaseRecord,
        UserAdminDetailViewModel
      >({
        id: "delete",
        kind: "mutation",
        label: tActions("delete"),
        color: "red",
        variant: "light",
        loading: deleteLoading,
        resourceAction: "delete",
        confirmation: ({ record }) => ({
          title: t("actions.deleteTitle"),
          message: t("actions.deleteMessage", { username: record.username }),
          confirmLabel: tActions("confirm"),
          cancelLabel: tActions("cancel"),
          destructive: true,
        }),
        onClick: async ({ notify, record, redirect }) => {
          await deleteUser(record.id);
          notify?.({
            message: t("actions.deleteSuccess"),
            type: "success",
          });
          redirect?.("/admin/users");
        },
      }),
    ],
  });
}
