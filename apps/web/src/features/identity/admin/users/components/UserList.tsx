"use client";

import { useTranslations } from "next-intl";
import { useMemo } from "react";

import { getAdminIdentity } from "../../../../platform/admin/session/adminIdentityStore";
import {
  AdminResourceTable,
  useAdminResourceTable,
  useAdminResourceTableViewResult,
} from "../../../../platform/admin/table";
import type { AdminIdentity } from "../../../../platform/admin/types/admin.types";
import {
  createUserTableConfig,
  type AdminUserRecord,
} from "../users-table.config";
import type {
  AdminLocale,
  UserAdminListItem,
  UserAdminPageMetadata,
  UserAdminSortField,
  UserAdminSortOrder,
} from "../types/user-admin.types";

interface UserListViewProps {
  identity: AdminIdentity | null;
  locale: AdminLocale;
  items: UserAdminListItem[];
  currentPage: number;
  pageSize: number;
  sortField: UserAdminSortField;
  sortOrder: UserAdminSortOrder;
  page?: UserAdminPageMetadata;
  loading?: boolean;
  fetching?: boolean;
  error?: boolean;
  forbidden?: boolean;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  onRetry?: () => void;
  onSortChange?: (field: UserAdminSortField, order: UserAdminSortOrder) => void;
}

export function UserList({ locale }: { locale: AdminLocale }) {
  const identity = getAdminIdentity();
  const config = useUserTableConfig({
    identity,
    locale,
  });
  const result = useAdminResourceTable<AdminUserRecord, UserAdminListItem>({
    config,
    identity,
    locale,
  });

  return <AdminResourceTable result={result} />;
}

export function UserListView({
  identity,
  locale,
  items,
  currentPage,
  pageSize,
  sortField,
  sortOrder,
  page,
  loading = false,
  fetching = false,
  error = false,
  forbidden = false,
  onPageChange,
  onPageSizeChange,
  onRetry,
  onSortChange,
}: UserListViewProps) {
  const config = useUserTableConfig({
    identity,
    locale,
  });
  const result = useAdminResourceTableViewResult<
    AdminUserRecord,
    UserAdminListItem
  >({
    config,
    identity,
    locale,
    rows: items,
    currentPage,
    pageSize,
    sortField,
    sortOrder,
    page,
    loading,
    fetching,
    error,
    forbidden,
    onPageChange,
    onPageSizeChange,
    onRetry,
    onSortChange: (field, order) =>
      onSortChange?.(field as UserAdminSortField, order),
  });

  return <AdminResourceTable result={result} />;
}

function useUserTableConfig({
  identity,
  locale,
}: {
  identity: AdminIdentity | null;
  locale: AdminLocale;
}) {
  const t = useTranslations("Admin.Users");
  const tStates = useTranslations("Admin.States");
  const tTableStatus = useTranslations("Admin.Table.status");
  const tTableHydration = useTranslations("Admin.Table.hydration");

  return useMemo(
    () =>
      createUserTableConfig({
        identity,
        locale,
        t,
        tStates,
        tTableHydration,
        tTableStatus,
      }),
    [identity, locale, t, tStates, tTableHydration, tTableStatus],
  );
}
