import { Anchor, Badge, Group, Text } from "@mantine/core";
import type { BaseRecord } from "@refinedev/core";
import type { ColumnDef } from "@tanstack/react-table";
import type { AdminCategoryDto } from "@tgp/contracts";
import type { useTranslations } from "next-intl";

import { Link } from "../../../../i18n/navigation";
import {
  AdminSortableHeader,
  type AdminResourceTableConfig,
  type AdminResourceTableDefaultSort,
} from "../../../platform/admin/table";
import type { AdminIdentity } from "../../../platform/admin/types/admin.types";
import { canPerformAdminAction } from "../../../platform/admin/utils/adminPermissions";
import type { AdminCategoryListingConfig } from "./admin-category-listing.config";
import {
  CategoryActions,
  CategoryActionsView,
  type CategoryActionGates,
} from "./components/CategoryActions";
import { mapCategoryDtoToListItem } from "./mappers/category-admin.mapper";
import type {
  AdminLocale,
  CategoryAdminListItem,
  CategoryListingScope,
} from "./types/category-admin.types";

export type AdminCategoryRecord = AdminCategoryDto & BaseRecord;

type AdminTranslator = ReturnType<typeof useTranslations>;

interface CategoryTableConfigOptions {
  actionGates?: (record: CategoryAdminListItem) => CategoryActionGates;
  childNavigationAvailable?: boolean;
  connectedActions: boolean;
  config: AdminCategoryListingConfig;
  defaultSort: AdminResourceTableDefaultSort;
  identity: AdminIdentity | null;
  locale: AdminLocale;
  moveActionsAvailable: boolean;
  scope: CategoryListingScope;
  stateActionsAvailable: boolean;
  t: AdminTranslator;
  tStates: AdminTranslator;
  tTableHydration: AdminTranslator;
  tTableStatus: AdminTranslator;
}

export function createCategoryTableConfig({
  actionGates,
  childNavigationAvailable = true,
  connectedActions,
  config,
  defaultSort,
  identity,
  locale,
  moveActionsAvailable,
  scope,
  stateActionsAvailable,
  t,
  tStates,
  tTableHydration,
  tTableStatus,
}: CategoryTableConfigOptions): AdminResourceTableConfig<
  AdminCategoryRecord,
  CategoryAdminListItem
> {
  const canCreate = canPerformAdminAction(
    identity,
    config.permissionResource,
    "create",
  );
  const canShow = canPerformAdminAction(identity, config.permissionResource, "show");
  const columns: Array<ColumnDef<CategoryAdminListItem, unknown>> = [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <AdminSortableHeader column={column} label={t("fields.name")} />
      ),
      cell: ({ row }) =>
        scope.mode !== "all" && childNavigationAvailable && row.original.hasChildren ? (
          <Anchor
            component={Link}
            href={config.childrenHref(row.original.id)}
            locale={locale}
            aria-label={t("list.viewChildren", { name: row.original.name })}
          >
            {row.original.name}
          </Anchor>
        ) : (
          <Text component="span">{row.original.name}</Text>
        ),
      enableSorting: true,
    },
    {
      accessorKey: "slug",
      header: ({ column }) => (
        <AdminSortableHeader column={column} label={t("fields.slug")} />
      ),
      enableSorting: true,
    },
    {
      accessorKey: "parentId",
      header: t("fields.parentId"),
      cell: ({ row }) => row.original.parentId ?? t("list.rootCategory"),
      enableSorting: false,
    },
    {
      accessorKey: "active",
      header: t("fields.status"),
      cell: ({ row }) => (
        <Badge color={row.original.active ? "green" : "gray"} variant="light">
          {row.original.active ? t("status.active") : t("status.inactive")}
        </Badge>
      ),
      enableSorting: false,
    },
    {
      accessorKey: "updatedAtLabel",
      id: "updatedAt",
      header: ({ column }) => (
        <AdminSortableHeader column={column} label={t("fields.updatedAt")} />
      ),
      cell: ({ row }) => row.original.updatedAtLabel,
      enableSorting: true,
    },
    {
      id: "actions",
      header: t("fields.actions"),
      cell: ({ row }) => (
        <Group gap={0} justify="flex-end" wrap="nowrap">
          {connectedActions ? (
            <CategoryActions
              apiBasePath={config.apiBasePath}
              category={row.original}
              actionGates={actionGates?.(row.original)}
              identity={identity}
              listHref={config.listHref}
              locale={locale}
              moveActionsAvailable={moveActionsAvailable}
              permissionResource={config.permissionResource}
              resource={config.resource}
              stateActionsAvailable={stateActionsAvailable}
              editHref={config.editHref(row.original.id)}
              viewHref={canShow ? config.showHref(row.original.id) : undefined}
            />
          ) : (
            <CategoryActionsView
              category={row.original}
              actionGates={actionGates?.(row.original)}
              identity={identity}
              locale={locale}
              moveActionsAvailable={moveActionsAvailable}
              permissionResource={config.permissionResource}
              stateActionsAvailable={stateActionsAvailable}
              editHref={config.editHref(row.original.id)}
              viewHref={canShow ? config.showHref(row.original.id) : undefined}
            />
          )}
        </Group>
      ),
      enableSorting: false,
      meta: {
        isActionColumn: true,
      },
    },
  ];

  return {
    resource: config.resource,
    getRowId: (row) => row.id,
    defaultSort,
    minWidth: 880,
    columns,
    mapDtoToRow: (dto) => mapCategoryDtoToListItem(dto, locale),
    labels: {
      title: t("title"),
      description: t("description"),
      loading: tStates("loading"),
      empty: tStates("empty"),
      errorTitle: tStates("errorTitle"),
      errorMessage: tStates("errorMessage"),
      forbiddenTitle: tStates("forbiddenTitle"),
      forbiddenMessage: tStates("forbiddenMessage"),
      retry: tStates("retry"),
      refetching: tTableStatus("refetching"),
      pageMetadata: (metadata) =>
        t("list.pageMetadata", {
          page: metadata.page,
          totalPages: metadata.totalPages,
          total: metadata.total,
        }),
      pageSizeLabel: t("list.pageSizeLabel"),
      paginationLabel: t("list.paginationLabel"),
      hydrationErrorTitle: tTableHydration("errorTitle"),
      hydrationErrorMessage: tTableHydration("errorMessage"),
    },
    createAction: {
      href: config.createHref,
      label: t("list.createCategory"),
      visible: canCreate,
    },
  };
}
