import type { BaseRecord } from "@refinedev/core";
import { describe, expect, it, vi } from "vitest";

import {
  render,
  screen,
  userEvent,
} from "../../../../../../tests/test-utils/render";
import { getAdminResourceMetadata } from "../../../../platform/admin/resources/adminResources";
import type { AdminIdentity } from "../../../../platform/admin/types/admin.types";
import type { AdminResourceDetailResult } from "../../../../platform/admin/detail";
import { UserDetailView } from "../components/UserDetail";
import { createUserDetailConfig } from "../user-admin.detail-config";
import type {
  AdminUserDetailRecord,
  UserAdminDetailViewModel,
} from "../types/user-admin-detail.types";

describe("UserDetail actions", () => {
  it("confirms delete, notifies success, and redirects to the user list", async () => {
    const user = userEvent.setup();
    const deleteUser = vi.fn().mockResolvedValue(undefined);
    const notify = vi.fn();
    const redirect = vi.fn();

    render(
      <UserDetailView
        result={detailResult({ deleteUser })}
        notify={notify}
        redirect={redirect}
      />,
    );

    await user.click(screen.getByRole("button", { name: /^delete$/i }));
    expect(await screen.findByRole("dialog")).toBeVisible();
    expect(screen.getByText(/delete admin/i)).toBeVisible();

    await user.click(screen.getByRole("button", { name: /^confirm$/i }));

    expect(deleteUser).toHaveBeenCalledWith("user_1");
    expect(notify).toHaveBeenCalledWith({
      message: "The user was deleted.",
      type: "success",
    });
    expect(redirect).toHaveBeenCalledWith("/admin/users");
  });

  it("confirms user status changes, notifies success, and refetches", async () => {
    const user = userEvent.setup();
    const changeUserState = vi.fn().mockResolvedValue(undefined);
    const notify = vi.fn();
    const refetch = vi.fn();

    render(
      <UserDetailView
        result={detailResult({
          changeUserState,
          identity: identity({
            roles: ["MODERATOR"],
            permissions: ["admin:users:read", "admin:users:status"],
            sessionScope: "moderator",
          }),
          onRetry: refetch,
        })}
        notify={notify}
      />,
    );

    await user.click(screen.getByRole("button", { name: /^deactivate$/i }));
    expect(await screen.findByRole("dialog")).toBeVisible();
    expect(screen.getByText(/change the active status for admin/i)).toBeVisible();

    await user.click(screen.getByRole("button", { name: /^confirm$/i }));

    expect(changeUserState).toHaveBeenCalledWith("user_1", false);
    expect(notify).toHaveBeenCalledWith({
      message: "The user was deactivated.",
      type: "success",
    });
    expect(refetch).toHaveBeenCalledOnce();
  });
});

function detailResult({
  changeUserState,
  deleteUser = vi.fn(),
  identity: userIdentity = identity({
    permissions: ["admin:users:read", "admin:users:write"],
  }),
  onRetry = vi.fn(),
}: {
  changeUserState?: (id: string, nextActive: boolean) => Promise<void>;
  deleteUser?: (id: string) => Promise<void>;
  identity?: AdminIdentity;
  onRetry?: () => void;
} = {}): AdminResourceDetailResult<
  AdminUserDetailRecord & BaseRecord,
  UserAdminDetailViewModel
> {
  const config = createUserDetailConfig({
    changeUserState,
    deleteUser,
    locale: "en-CA",
    t: translator(),
    tActions: translator(),
    tDetail: translator(),
    tStates: translator(),
  });

  return {
    config,
    error: null,
    id: "user_1",
    identity: userIdentity,
    isFetching: false,
    isForbidden: false,
    isInvalidRouteId: false,
    isLoading: false,
    labels: config.labels,
    locale: "en-CA",
    metadata: getAdminResourceMetadata("users"),
    onRetry,
    queryEnabled: true,
    record: {
      active: true,
      createdAtLabel: "May 29, 2026, 12:00 p.m.",
      displayName: "Admin User",
      email: "admin@example.test",
      id: "user_1",
      permissionsLabel: "admin:users:read",
      rolesLabel: "ADMIN",
      updatedAtLabel: "May 30, 2026, 12:00 p.m.",
      username: "admin",
    },
    resource: "users",
    rawRecord: {
      accountNonExpired: true,
      accountNonLocked: true,
      active: true,
      createdAt: "2026-05-29T12:00:00.000Z",
      credentialsNonExpired: true,
      email: "admin@example.test",
      firstName: "Admin",
      id: "user_1",
      lastName: "User",
      permissions: ["admin:users:read"],
      roles: ["ADMIN"],
      updatedAt: "2026-05-30T12:00:00.000Z",
      username: "admin",
    },
    state: "ready",
  };
}

function identity(overrides: Partial<AdminIdentity> = {}): AdminIdentity {
  return {
    id: "admin_1",
    username: "admin",
    roles: [],
    permissions: [],
    sessionScope: "admin",
    ...overrides,
  };
}

function translator() {
  const messages: Record<string, string> = {
    "actions.deleteMessage": "Delete {username}? This action cannot be undone.",
    "actions.deleteSuccess": "The user was deleted.",
    "actions.deleteTitle": "Delete user",
    "actions.activate": "Activate",
    "actions.activateSuccess": "The user was activated.",
    "actions.deactivate": "Deactivate",
    "actions.deactivateSuccess": "The user was deactivated.",
    "actions.stateMessage": "Change the active status for {username}?",
    "actions.stateTitle": "Confirm user status change",
    "fields.createdAt": "Created",
    "fields.displayName": "Display name",
    "fields.permissions": "Permissions",
    "fields.roles": "Roles",
    "fields.status": "Status",
    "fields.updatedAt": "Updated",
    "form.loading": "Loading user",
    "list.notProvided": "Not provided",
    "sections.access": "Access",
    "sections.accessDescription": "Roles and permissions use configured values.",
    "sections.account": "Account details",
    "show.backToList": "Back to users",
    "status.active": "Active",
    "status.inactive": "Inactive",
    cancel: "Cancel",
    confirm: "Confirm",
    delete: "Delete",
    edit: "Edit",
    emptyMessage: "No configured detail content is visible for this record.",
    emptyTitle: "No visible detail content",
    errorMessage: "The admin dashboard could not complete this request.",
    errorTitle: "Something went wrong",
    forbiddenMessage: "You do not have permission to use this admin workflow.",
    forbiddenTitle: "Access denied",
    invalidMessage: "This admin record link is invalid.",
    invalidTitle: "Record unavailable",
    notFoundMessage: "This admin record could not be found.",
    notFoundTitle: "Record not found",
    retry: "Try again",
  };

  return ((key: string, values?: Record<string, string>) => {
    const template = messages[key] ?? key;

    return Object.entries(values ?? {}).reduce(
      (current, [name, value]) => current.replace(`{${name}}`, value),
      template,
    );
  }) as never;
}
