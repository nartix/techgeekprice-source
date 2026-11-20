import type { AdminUserDto } from "@tgp/contracts";

import { mapUserDtoToListItem } from "./user-admin.mapper";
import type { AdminLocale } from "../types/user-admin.types";
import type { UserAdminDetailViewModel } from "../types/user-admin-detail.types";

export function mapUserDtoToDetailViewModel(
  user: AdminUserDto,
  locale: AdminLocale,
): UserAdminDetailViewModel {
  const listItem = mapUserDtoToListItem(user, locale);

  return {
    id: listItem.id,
    username: listItem.username,
    email: listItem.email,
    displayName: listItem.displayName,
    active: listItem.active,
    rolesLabel: listItem.rolesLabel,
    permissionsLabel: listItem.permissionsLabel,
    createdAtLabel: listItem.createdAtLabel,
    updatedAtLabel: listItem.updatedAtLabel,
  };
}
