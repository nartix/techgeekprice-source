import type { AdminUserDto } from "@tgp/contracts";

export interface UserAdminDetailViewModel {
  id: string;
  username: string;
  email: string;
  displayName: string;
  active: boolean;
  rolesLabel: string;
  permissionsLabel: string;
  createdAtLabel: string;
  updatedAtLabel: string;
}

export interface UserAdminDetailActionRecord {
  id: string;
  username: string;
}

export type AdminUserDetailRecord = AdminUserDto & {
  id: string;
};
