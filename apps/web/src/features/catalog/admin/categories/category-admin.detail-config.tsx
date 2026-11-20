import { Badge } from "@mantine/core";
import type { BaseRecord } from "@refinedev/core";
import type { useTranslations } from "next-intl";

import {
  adminDetailAction,
  defineAdminDetailConfig,
  detailField,
  detailSection,
  type AdminDetailDefinition,
  type AdminDetailLocale,
} from "../../../platform/admin/detail";
import type { AdminCategoryListingConfig } from "./admin-category-listing.config";
import { mapCategoryDtoToDetailViewModel } from "./mappers/category-admin-detail.mapper";
import type {
  AdminCategoryDetailRecord,
  CategoryAdminDetailViewModel,
} from "./types/category-admin-detail.types";

type AdminTranslator = ReturnType<typeof useTranslations>;

interface CreateCategoryDetailConfigOptions {
  isActionSupported?: (
    operation: "delete" | "move" | "activate" | "deactivate",
    record: CategoryAdminDetailViewModel,
  ) => boolean;
  changeStateLoading?: boolean;
  changeCategoryState: (id: string, nextActive: boolean) => Promise<void>;
  config: AdminCategoryListingConfig;
  deleteCategory: (id: string) => Promise<void>;
  deleteLoading?: boolean;
  locale: AdminDetailLocale;
  moveLoading?: boolean;
  openMoveDialog?: (record: CategoryAdminDetailViewModel) => void;
  t: AdminTranslator;
  tActions: AdminTranslator;
  tDetail: AdminTranslator;
  tStates: AdminTranslator;
}

export function createCategoryDetailConfig({
  changeCategoryState,
  changeStateLoading = false,
  config,
  deleteCategory,
  deleteLoading = false,
  isActionSupported,
  locale,
  moveLoading = false,
  openMoveDialog,
  t,
  tActions,
  tDetail,
  tStates,
}: CreateCategoryDetailConfigOptions): AdminDetailDefinition<
  AdminCategoryDetailRecord & BaseRecord,
  CategoryAdminDetailViewModel
> {
  return defineAdminDetailConfig<
    AdminCategoryDetailRecord & BaseRecord,
    CategoryAdminDetailViewModel
  >({
    resource: config.resource,
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
    title: ({ record }) => record.name,
    description: ({ record }) => record.slug,
    transformRecord: (record) =>
      mapCategoryDtoToDetailViewModel(record, locale),
    sections: [
      detailSection<
        AdminCategoryDetailRecord & BaseRecord,
        CategoryAdminDetailViewModel
      >({
        id: "category",
        title: t("sections.category"),
        fields: [
          detailField<
            AdminCategoryDetailRecord & BaseRecord,
            CategoryAdminDetailViewModel,
            "slug"
          >({
            id: "slug",
            label: t("fields.slug"),
            valueKey: "slug",
          }),
          detailField<
            AdminCategoryDetailRecord & BaseRecord,
            CategoryAdminDetailViewModel,
            "parentId"
          >({
            id: "parentId",
            label: t("fields.parentId"),
            valueKey: "parentId",
            emptyFallback: t("list.rootCategory"),
            safeRenderer: true,
            sensitive: true,
            sensitiveKind: "internal-identifier",
            render: ({ value }) =>
              value ? String(value) : t("list.rootCategory"),
          }),
          detailField<
            AdminCategoryDetailRecord & BaseRecord,
            CategoryAdminDetailViewModel,
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
            AdminCategoryDetailRecord & BaseRecord,
            CategoryAdminDetailViewModel,
            "createdAtLabel"
          >({
            id: "createdAt",
            label: t("fields.createdAt"),
            valueKey: "createdAtLabel",
          }),
          detailField<
            AdminCategoryDetailRecord & BaseRecord,
            CategoryAdminDetailViewModel,
            "updatedAtLabel"
          >({
            id: "updatedAt",
            label: t("fields.updatedAt"),
            valueKey: "updatedAtLabel",
          }),
        ],
      }),
    ],
    actions: [
      adminDetailAction<
        AdminCategoryDetailRecord & BaseRecord,
        CategoryAdminDetailViewModel
      >({
        id: "back",
        kind: "navigation",
        href: config.listHref,
        label: t("show.backToList"),
      }),
      adminDetailAction<
        AdminCategoryDetailRecord & BaseRecord,
        CategoryAdminDetailViewModel
      >({
        id: "edit",
        kind: "navigation",
        href: ({ record }) => config.editHref(record.id),
        label: tActions("edit"),
        resourceAction: "edit",
      }),
      adminDetailAction<
        AdminCategoryDetailRecord & BaseRecord,
        CategoryAdminDetailViewModel
      >({
        id: "move",
        kind: "mutation",
        label: t("actions.move"),
        loading: moveLoading,
        resourceAction: "move",
        variant: "light",
        isSupported: ({ record }) =>
          Boolean(openMoveDialog) &&
          (isActionSupported?.("move", record) ?? true),
        onClick: ({ record }) => {
          openMoveDialog?.(record);
        },
      }),
      adminDetailAction<
        AdminCategoryDetailRecord & BaseRecord,
        CategoryAdminDetailViewModel
      >({
        id: "activate",
        kind: "mutation",
        label: t("actions.activate"),
        color: "green",
        variant: "light",
        loading: changeStateLoading,
        resourceAction: "state",
        visibleWhen: ({ record }) => !record.active,
        isSupported: ({ record }) =>
          isActionSupported?.("activate", record) ?? true,
        confirmation: ({ record }) => ({
          title: t("actions.stateTitle"),
          message: t("actions.stateMessage", { name: record.name }),
          confirmLabel: tActions("confirm"),
          cancelLabel: tActions("cancel"),
        }),
        onClick: async ({ notify, record, refetch }) => {
          await changeCategoryState(record.id, true);
          notify?.({
            message: t("actions.activateSuccess"),
            type: "success",
          });
          await refetch?.();
        },
      }),
      adminDetailAction<
        AdminCategoryDetailRecord & BaseRecord,
        CategoryAdminDetailViewModel
      >({
        id: "deactivate",
        kind: "mutation",
        label: t("actions.deactivate"),
        color: "orange",
        variant: "light",
        loading: changeStateLoading,
        resourceAction: "state",
        visibleWhen: ({ record }) => record.active,
        isSupported: ({ record }) =>
          isActionSupported?.("deactivate", record) ?? true,
        confirmation: ({ record }) => ({
          title: t("actions.stateTitle"),
          message: t("actions.stateMessage", { name: record.name }),
          confirmLabel: tActions("confirm"),
          cancelLabel: tActions("cancel"),
          destructive: true,
        }),
        onClick: async ({ notify, record, refetch }) => {
          await changeCategoryState(record.id, false);
          notify?.({
            message: t("actions.deactivateSuccess"),
            type: "success",
          });
          await refetch?.();
        },
      }),
      adminDetailAction<
        AdminCategoryDetailRecord & BaseRecord,
        CategoryAdminDetailViewModel
      >({
        id: "delete",
        kind: "mutation",
        label: tActions("delete"),
        color: "red",
        variant: "light",
        loading: deleteLoading,
        resourceAction: "delete",
        isSupported: ({ record }) =>
          isActionSupported?.("delete", record) ?? true,
        confirmation: ({ record }) => ({
          title: t("actions.deleteTitle"),
          message: t("actions.deleteMessage", { name: record.name }),
          confirmLabel: tActions("confirm"),
          cancelLabel: tActions("cancel"),
          destructive: true,
        }),
        onClick: async ({ notify, record, redirect }) => {
          await deleteCategory(record.id);
          notify?.({
            message: t("actions.deleteSuccess"),
            type: "success",
          });
          redirect?.(config.listHref);
        },
      }),
    ],
  });
}
