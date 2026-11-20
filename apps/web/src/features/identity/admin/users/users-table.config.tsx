import { Badge, Button, Group, Text } from "@mantine/core";
import type { BaseRecord } from "@refinedev/core";
import type { ColumnDef } from "@tanstack/react-table";
import type { AdminUserDto } from "@tgp/contracts";
import type { useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { Link } from "../../../../i18n/navigation";
import {
  AdminSortableHeader,
  type AdminResourceTableConfig,
} from "../../../platform/admin/table";
import type { AdminIdentity } from "../../../platform/admin/types/admin.types";
import { canPerformAdminAction } from "../../../platform/admin/utils/adminPermissions";
import { mapUserDtoToListItem } from "./mappers/user-admin.mapper";
import type { AdminLocale, UserAdminListItem } from "./types/user-admin.types";

export type AdminUserRecord = AdminUserDto & BaseRecord;

type AdminTranslator = ReturnType<typeof useTranslations>;

interface UserTableConfigOptions {
  identity: AdminIdentity | null;
  locale: AdminLocale;
  t: AdminTranslator;
  tStates: AdminTranslator;
  tTableHydration: AdminTranslator;
  tTableStatus: AdminTranslator;
}

export function createUserTableConfig({
  identity,
  locale,
  t,
  tStates,
  tTableHydration,
  tTableStatus,
}: UserTableConfigOptions): AdminResourceTableConfig<
  AdminUserRecord,
  UserAdminListItem
> {
  const canCreate = canPerformAdminAction(identity, "users", "create");
  const canShow = canPerformAdminAction(identity, "users", "show");
  const canEdit = canPerformAdminAction(identity, "users", "edit");
  const columns: Array<ColumnDef<UserAdminListItem, unknown>> = [
    {
      accessorKey: "id",
      header: ({ column }) => (
        <AdminSortableHeader column={column} label={t("fields.id")} />
      ),
      enableSorting: true,
      meta: {
        minWidth: 72,
      },
    },
    {
      accessorKey: "username",
      header: ({ column }) => (
        <AdminSortableHeader column={column} label={t("fields.username")} />
      ),
      enableSorting: true,
      meta: {
        minWidth: 140,
      },
    },
    {
      accessorKey: "email",
      header: ({ column }) => (
        <AdminSortableHeader column={column} label={t("fields.email")} />
      ),
      enableSorting: true,
      meta: {
        minWidth: 220,
      },
    },
    {
      accessorKey: "firstName",
      header: ({ column }) => (
        <AdminSortableHeader column={column} label={t("fields.firstName")} />
      ),
      cell: ({ row }) => (
        <OptionalText
          value={row.original.firstName}
          fallback={t("list.notProvided")}
        />
      ),
      enableSorting: true,
      meta: {
        minWidth: 140,
      },
    },
    {
      accessorKey: "lastName",
      header: ({ column }) => (
        <AdminSortableHeader column={column} label={t("fields.lastName")} />
      ),
      cell: ({ row }) => (
        <OptionalText
          value={row.original.lastName}
          fallback={t("list.notProvided")}
        />
      ),
      enableSorting: true,
      meta: {
        minWidth: 140,
      },
    },
    {
      accessorKey: "active",
      header: ({ column }) => (
        <AdminSortableHeader column={column} label={t("fields.status")} />
      ),
      cell: ({ row }) => (
        <Badge color={row.original.active ? "green" : "gray"} variant="light">
          {row.original.active ? t("status.active") : t("status.inactive")}
        </Badge>
      ),
      enableSorting: true,
      meta: {
        minWidth: 120,
      },
    },
    {
      accessorKey: "accountNonExpired",
      header: ({ column }) => (
        <AdminSortableHeader
          column={column}
          label={t("fields.accountNonExpired")}
        />
      ),
      cell: ({ row }) => (
        <StateBadge
          value={row.original.accountNonExpired}
          trueLabel={t("status.accountValid")}
          falseLabel={t("status.accountExpired")}
        />
      ),
      enableSorting: true,
      meta: {
        minWidth: 160,
      },
    },
    {
      accessorKey: "accountNonLocked",
      header: ({ column }) => (
        <AdminSortableHeader
          column={column}
          label={t("fields.accountNonLocked")}
        />
      ),
      cell: ({ row }) => (
        <StateBadge
          value={row.original.accountNonLocked}
          trueLabel={t("status.unlocked")}
          falseLabel={t("status.locked")}
        />
      ),
      enableSorting: true,
      meta: {
        minWidth: 160,
      },
    },
    {
      accessorKey: "credentialsNonExpired",
      header: ({ column }) => (
        <AdminSortableHeader
          column={column}
          label={t("fields.credentialsNonExpired")}
        />
      ),
      cell: ({ row }) => (
        <StateBadge
          value={row.original.credentialsNonExpired}
          trueLabel={t("status.credentialsValid")}
          falseLabel={t("status.credentialsExpired")}
        />
      ),
      enableSorting: true,
      meta: {
        minWidth: 180,
      },
    },
    {
      id: "roles",
      accessorFn: (row) => row.rolesLabel,
      header: ({ column }) => (
        <AdminSortableHeader column={column} label={t("fields.roles")} />
      ),
      cell: ({ row }) => (
        <OptionalText
          value={row.original.rolesLabel}
          fallback={t("list.notProvided")}
        />
      ),
      enableSorting: true,
      meta: {
        minWidth: 180,
      },
    },
    {
      id: "permissions",
      accessorFn: (row) => row.permissionsLabel,
      header: ({ column }) => (
        <AdminSortableHeader column={column} label={t("fields.permissions")} />
      ),
      cell: ({ row }) => (
        <OptionalText
          value={row.original.permissionsLabel}
          fallback={t("list.notProvided")}
        />
      ),
      enableSorting: true,
      meta: {
        minWidth: 220,
      },
    },
    {
      accessorKey: "lastLoginAtLabel",
      id: "lastLoginAt",
      header: ({ column }) => (
        <AdminSortableHeader column={column} label={t("fields.lastLoginAt")} />
      ),
      cell: ({ row }) => (
        <OptionalText
          value={row.original.lastLoginAtLabel}
          fallback={t("list.notProvided")}
        />
      ),
      enableSorting: true,
      meta: {
        minWidth: 180,
      },
    },
    {
      accessorKey: "lastActivityAtLabel",
      id: "lastActivityAt",
      header: ({ column }) => (
        <AdminSortableHeader
          column={column}
          label={t("fields.lastActivityAt")}
        />
      ),
      cell: ({ row }) => (
        <OptionalText
          value={row.original.lastActivityAtLabel}
          fallback={t("list.notProvided")}
        />
      ),
      enableSorting: true,
      meta: {
        minWidth: 180,
      },
    },
    {
      accessorKey: "createdAtLabel",
      id: "createdAt",
      header: ({ column }) => (
        <AdminSortableHeader column={column} label={t("fields.createdAt")} />
      ),
      cell: ({ row }) => row.original.createdAtLabel,
      enableSorting: true,
      meta: {
        minWidth: 180,
      },
    },
    {
      accessorKey: "updatedAtLabel",
      id: "updatedAt",
      header: ({ column }) => (
        <AdminSortableHeader column={column} label={t("fields.updatedAt")} />
      ),
      cell: ({ row }) => row.original.updatedAtLabel,
      enableSorting: true,
      meta: {
        minWidth: 180,
      },
    },
    {
      accessorKey: "createdBy",
      header: ({ column }) => (
        <AdminSortableHeader column={column} label={t("fields.createdBy")} />
      ),
      cell: ({ row }) => (
        <OptionalText
          value={row.original.createdBy}
          fallback={t("list.notProvided")}
        />
      ),
      enableSorting: true,
      meta: {
        minWidth: 160,
      },
    },
    {
      accessorKey: "updatedBy",
      header: ({ column }) => (
        <AdminSortableHeader column={column} label={t("fields.updatedBy")} />
      ),
      cell: ({ row }) => (
        <OptionalText
          value={row.original.updatedBy}
          fallback={t("list.notProvided")}
        />
      ),
      enableSorting: true,
      meta: {
        minWidth: 160,
      },
    },
    {
      id: "actions",
      header: t("fields.actions"),
      cell: ({ row }) => (
        <Group gap="xs">
          {canShow ? (
            <Button
              component={Link}
              href={`/admin/users/${row.original.id}`}
              locale={locale}
              size="xs"
              variant="subtle"
            >
              {t("actions.show")}
            </Button>
          ) : null}
          {canEdit ? (
            <Button
              component={Link}
              href={`/admin/users/${row.original.id}/edit`}
              locale={locale}
              size="xs"
              variant="subtle"
            >
              {t("actions.edit")}
            </Button>
          ) : null}
        </Group>
      ),
      enableSorting: false,
      meta: {
        isActionColumn: true,
        minWidth: 160,
      },
    },
  ];

  return {
    resource: "users",
    getRowId: (row) => row.id,
    defaultSort: {
      field: "updatedAt",
      order: "desc",
    },
    minWidth: 2920,
    columns,
    mapDtoToRow: (dto) => mapUserDtoToListItem(dto, locale),
    hydrateRows: undefined,
    beforeDisplayRow: undefined,
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
      href: "/admin/users/create",
      label: t("list.createUser"),
      visible: canCreate,
    },
  };
}

function OptionalText({
  fallback,
  value,
}: {
  fallback: string;
  value: string;
}) {
  return value ? (
    <Text size="sm">{value}</Text>
  ) : (
    <Text c="dimmed" size="sm">
      {fallback}
    </Text>
  );
}

function StateBadge({
  falseLabel,
  trueLabel,
  value,
}: {
  falseLabel: ReactNode;
  trueLabel: ReactNode;
  value: boolean;
}) {
  return (
    <Badge color={value ? "green" : "gray"} variant="light">
      {value ? trueLabel : falseLabel}
    </Badge>
  );
}
