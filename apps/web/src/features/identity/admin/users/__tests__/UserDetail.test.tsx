import type { BaseRecord } from "@refinedev/core";
import { describe, expect, it, vi } from "vitest";

import { render, screen } from "../../../../../../tests/test-utils/render";
import { getAdminResourceMetadata } from "../../../../platform/admin/resources/adminResources";
import type { AdminIdentity } from "../../../../platform/admin/types/admin.types";
import type { AdminResourceDetailResult } from "../../../../platform/admin/detail";
import { UserDetailView } from "../components/UserDetail";
import { createUserDetailConfig } from "../user-admin.detail-config";
import type {
  AdminUserDetailRecord,
  UserAdminDetailViewModel,
} from "../types/user-admin-detail.types";

describe("UserDetailView", () => {
  it("renders loading and forbidden states safely", () => {
    const { rerender } = render(
      <UserDetailView result={detailResult({ state: "loading" })} />,
    );

    expect(screen.getByText(/loading user/i)).toBeVisible();

    rerender(<UserDetailView result={detailResult({ state: "forbidden" })} />);
    expect(screen.getByText(/access denied/i)).toBeVisible();
  });

  it("renders configured safe fields and readable active status", () => {
    render(<UserDetailView result={detailResult()} />);

    expect(screen.getByRole("heading", { name: /^admin$/i })).toBeVisible();
    expect(screen.getByText("admin@example.test")).toBeVisible();
    expect(screen.getByText("Admin User")).toBeVisible();
    expect(screen.getByText("ADMIN")).toBeVisible();
    expect(screen.getByText("admin:users:read")).toBeVisible();
    expect(screen.getByText(/^active$/i)).toBeVisible();
  });

  it("hides write actions for read-only admins and shows them for writers", () => {
    const { rerender } = render(
      <UserDetailView
        result={detailResult({
          identity: identity({ permissions: ["admin:users:read"] }),
        })}
      />,
    );

    expect(screen.queryByRole("link", { name: /^edit$/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /^delete$/i })).toBeNull();

    rerender(<UserDetailView result={detailResult()} />);

    expect(screen.getByRole("link", { name: /^edit$/i })).toHaveAttribute(
      "href",
      "/en-CA/admin/users/user_1/edit",
    );
    expect(screen.getByRole("button", { name: /^delete$/i })).toBeVisible();
  });

  it("shows status action for seeded moderators without edit or delete", () => {
    render(
      <UserDetailView
        result={detailResult({
          changeUserState: vi.fn(),
          identity: identity({
            roles: ["MODERATOR"],
            permissions: ["admin:users:read", "admin:users:status"],
            sessionScope: "moderator",
          }),
        })}
      />,
    );

    expect(screen.getByRole("button", { name: /^deactivate$/i })).toBeVisible();
    expect(screen.queryByRole("link", { name: /^edit$/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /^delete$/i })).toBeNull();
  });

  it("does not render sensitive raw DTO values or raw JSON fallback output", () => {
    render(
      <UserDetailView
        result={detailResult({
          rawRecord: {
            ...rawUser(),
            passwordHash: "hash-secret",
            refreshToken: "refresh-secret",
            sessionId: "session-secret",
          } as AdminUserDetailRecord & BaseRecord,
        })}
      />,
    );

    expect(screen.queryByText(/hash-secret/i)).toBeNull();
    expect(screen.queryByText(/refresh-secret/i)).toBeNull();
    expect(screen.queryByText(/session-secret/i)).toBeNull();
    expect(screen.queryByText(/passwordHash/i)).toBeNull();
  });
});

function detailResult(
  options: Partial<
    AdminResourceDetailResult<
      AdminUserDetailRecord & BaseRecord,
      UserAdminDetailViewModel
    >
  > & {
    changeUserState?: (id: string, nextActive: boolean) => Promise<void>;
  } = {},
): AdminResourceDetailResult<
  AdminUserDetailRecord & BaseRecord,
  UserAdminDetailViewModel
> {
  const rawRecord = options.rawRecord ?? rawUser();
  const record =
    options.record ??
    ({
      active: true,
      createdAtLabel: "May 29, 2026, 12:00 p.m.",
      displayName: "Admin User",
      email: "admin@example.test",
      id: "user_1",
      permissionsLabel: "admin:users:read",
      rolesLabel: "ADMIN",
      updatedAtLabel: "May 30, 2026, 12:00 p.m.",
      username: "admin",
    } satisfies UserAdminDetailViewModel);
  const config = createUserDetailConfig({
    changeUserState: options.changeUserState,
    deleteUser: vi.fn(),
    locale: "en-CA",
    t: translator(),
    tActions: translator(),
    tDetail: translator(),
    tStates: translator(),
  });
  const state = options.state ?? "ready";

  return {
    config,
    error: null,
    id: "user_1",
    identity: identity({
      permissions: ["admin:users:read", "admin:users:write"],
    }),
    isFetching: false,
    isForbidden: state === "forbidden",
    isInvalidRouteId: state === "invalid",
    isLoading: state === "loading",
    labels: config.labels,
    locale: "en-CA",
    metadata: getAdminResourceMetadata("users"),
    onRetry: vi.fn(),
    queryEnabled: true,
    record,
    resource: "users",
    rawRecord,
    state,
    ...options,
  };
}

function rawUser(): AdminUserDetailRecord & BaseRecord {
  return {
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
