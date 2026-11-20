import type {
  AdminUserCreateDto,
  AdminUserDto,
  AdminUserMutationDto,
} from "@tgp/contracts";

import type {
  AdminLocale,
  UserAdminFormValues,
  UserAdminListItem,
} from "../types/user-admin.types";

export const emptyUserAdminFormValues: UserAdminFormValues = {
  id: undefined,
  username: "",
  email: "",
  password: "",
  confirmPassword: "",
  firstName: "",
  lastName: "",
  roles: [],
  permissions: [],
  active: true,
};

export function mapUserDtoToListItem(
  user: AdminUserDto,
  locale: AdminLocale,
): UserAdminListItem {
  const displayName = [user.firstName, user.lastName].filter(Boolean).join(" ");

  return {
    id: user.id,
    username: user.username,
    email: user.email,
    firstName: user.firstName ?? "",
    lastName: user.lastName ?? "",
    displayName: displayName || user.username,
    active: user.active,
    accountNonExpired: user.accountNonExpired,
    accountNonLocked: user.accountNonLocked,
    credentialsNonExpired: user.credentialsNonExpired,
    rolesLabel: joinValues(user.roles),
    permissionsLabel: joinValues(user.permissions),
    lastLoginAtLabel: formatOptionalDate(user.lastLoginAt, locale),
    lastActivityAtLabel: formatOptionalDate(user.lastActivityAt, locale),
    createdAtLabel: formatDate(user.createdAt, locale),
    updatedAtLabel: formatDate(user.updatedAt, locale),
    createdBy: user.createdBy ?? "",
    updatedBy: user.updatedBy ?? "",
    dto: user,
  };
}

export function mapUserDtoToFormValues(
  user: AdminUserDto,
): UserAdminFormValues {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    password: "",
    confirmPassword: "",
    firstName: user.firstName ?? "",
    lastName: user.lastName ?? "",
    roles: user.roles ?? [],
    permissions: user.permissions ?? [],
    active: user.active,
  };
}

export function mapUserFormValuesToCreateDto(
  values: UserAdminFormValues,
): AdminUserCreateDto {
  return {
    ...mapUserFormValuesToMutationDto(values),
    password: values.password,
  };
}

export function mapUserFormValuesToMutationDto(
  values: UserAdminFormValues,
): AdminUserMutationDto {
  return {
    username: values.username.trim(),
    email: values.email.trim(),
    firstName: emptyToNull(values.firstName),
    lastName: emptyToNull(values.lastName),
    roles: values.roles,
    permissions: values.permissions,
    active: values.active,
  };
}

function formatDate(value: string, locale: AdminLocale): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatOptionalDate(
  value: string | null | undefined,
  locale: AdminLocale,
): string {
  return value ? formatDate(value, locale) : "";
}

function joinValues(values: string[] | undefined): string {
  return values && values.length > 0 ? values.join(", ") : "";
}

function emptyToNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}
