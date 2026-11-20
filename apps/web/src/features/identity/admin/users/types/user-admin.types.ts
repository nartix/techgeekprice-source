import type { AdminUserDto } from "@tgp/contracts";

export type AdminLocale = "en-CA" | "en-US" | "fr-CA";

export type UserAdminSortField =
  | "id"
  | "username"
  | "email"
  | "firstName"
  | "lastName"
  | "active"
  | "accountNonExpired"
  | "accountNonLocked"
  | "credentialsNonExpired"
  | "lastLoginAt"
  | "lastActivityAt"
  | "roles"
  | "permissions"
  | "updatedAt"
  | "createdAt"
  | "createdBy"
  | "updatedBy";

export type UserAdminSortOrder = "asc" | "desc";

export interface UserAdminPageMetadata {
  number: number;
  size: number;
  totalElements: number;
  totalPages: number;
  numberOfElements: number;
  first: boolean;
  last: boolean;
}

export interface UserAdminListItem {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  displayName: string;
  active: boolean;
  accountNonExpired: boolean;
  accountNonLocked: boolean;
  credentialsNonExpired: boolean;
  rolesLabel: string;
  permissionsLabel: string;
  lastLoginAtLabel: string;
  lastActivityAtLabel: string;
  createdAtLabel: string;
  updatedAtLabel: string;
  createdBy: string;
  updatedBy: string;
  dto: AdminUserDto;
  [key: string]: unknown;
}

export interface UserAdminFormValues {
  id?: string;
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  roles: string[];
  permissions: string[];
  active: boolean;
}
