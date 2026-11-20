import type { AdminUserDto } from "@tgp/contracts";
import { describe, expect, it, vi } from "vitest";

import {
  render,
  screen,
  userEvent,
} from "../../../../../../tests/test-utils/render";
import type { AdminIdentity } from "../../../../platform/admin/types/admin.types";
import { UserListView } from "../components/UserList";
import { mapUserDtoToListItem } from "../mappers/user-admin.mapper";
import type { UserAdminPageMetadata } from "../types/user-admin.types";

describe("UserListView", () => {
  it("renders list states, out-of-range metadata, and sorting", async () => {
    const user = userEvent.setup();
    const onSortChange = vi.fn();
    const onPageSizeChange = vi.fn();
    const baseProps = listProps({ items: [] });
    const { rerender } = render(<UserListView {...baseProps} loading />);

    expect(screen.getByText(/loading admin dashboard/i)).toBeVisible();

    rerender(
      <UserListView {...baseProps} page={pageMetadata({ number: 4 })} />,
    );
    expect(screen.getByText(/page 5 of 2 - 21 total/i)).toBeVisible();
    expect(screen.getByText(/no records found/i)).toBeVisible();

    rerender(<UserListView {...baseProps} error onRetry={vi.fn()} />);
    expect(screen.getByText(/something went wrong/i)).toBeVisible();

    rerender(
      <UserListView
        {...listProps({
          onSortChange,
          onPageSizeChange,
          sortField: "username",
          sortOrder: "desc",
        })}
      />,
    );
    expect(screen.getByRole("link", { name: /create user/i })).toBeVisible();
    for (const label of [
      "ID",
      "Email",
      "First name",
      "Last name",
      "Status",
      "Account expiry",
      "Lock status",
      "Credential expiry",
      "Roles",
      "Permissions",
      "Last login",
      "Last activity",
      "Created",
      "Updated",
      "Created by",
      "Updated by",
    ]) {
      expect(
        screen.getByRole("button", {
          name: new RegExp(`^sort by ${label}$`, "i"),
        }),
      ).toBeVisible();
    }
    await user.click(
      screen.getByRole("button", { name: /username sorted descending/i }),
    );
    expect(onSortChange).toHaveBeenCalledWith("username", "asc");

    await user.click(screen.getByRole("combobox", { name: /rows per page/i }));
    await user.click(screen.getByRole("option", { name: "50" }));
    expect(onPageSizeChange).toHaveBeenCalledWith(50);
  });

  it("preserves rows while showing refetching status", () => {
    render(<UserListView {...listProps({ fetching: true })} />);

    expect(screen.getByText("admin@example.test")).toBeVisible();
    expect(screen.getByText(/refreshing table data/i)).toBeVisible();
  });

  it("preserves user-specific cells and fallbacks", () => {
    render(
      <UserListView
        {...listProps({
          items: [
            mapUserDtoToListItem(
              userDto({
                firstName: null,
                lastName: null,
                roles: [],
                active: false,
              }),
              "en-CA",
            ),
          ],
        })}
      />,
    );

    expect(screen.getAllByText("admin")[0]).toBeVisible();
    expect(screen.getByText("admin@example.test")).toBeVisible();
    expect(screen.getByText("Inactive")).toBeVisible();
    expect(screen.getByText("Account valid")).toBeVisible();
    expect(screen.getByText("Unlocked")).toBeVisible();
    expect(screen.getByText("Credentials valid")).toBeVisible();
    expect(screen.getAllByText("Not provided").length).toBeGreaterThanOrEqual(
      3,
    );
    expect(screen.getByText(/may 28, 2026/i)).toBeVisible();
    expect(screen.getByText(/may 29, 2026/i)).toBeVisible();
    expect(screen.getByText(/may 30, 2026/i)).toBeVisible();
    expect(screen.getByText(/may 31, 2026/i)).toBeVisible();
    expect(screen.getByText("system")).toBeVisible();
    expect(screen.getByText("admin-updater")).toBeVisible();
    expect(screen.getByRole("link", { name: /view details/i })).toBeVisible();
    expect(screen.getByRole("link", { name: /edit/i })).toBeVisible();
  });

  it("renders rows and hides write actions for read-only users", () => {
    const { rerender } = render(
      <UserListView
        {...listProps({
          identity: identity({ permissions: ["admin:users:read"] }),
          items: [mapUserDtoToListItem(userDto(), "en-CA")],
        })}
      />,
    );

    expect(screen.getByText("admin@example.test")).toBeVisible();
    expect(screen.getByText("Admin")).toBeVisible();
    expect(screen.getByText("User")).toBeVisible();
    expect(screen.getByRole("link", { name: /view details/i })).toBeVisible();
    expect(screen.queryByRole("link", { name: /create user/i })).toBeNull();
    expect(screen.queryByRole("link", { name: /edit/i })).toBeNull();

    rerender(
      <UserListView
        {...listProps({
          identity: identity({
            permissions: ["admin:users:read", "admin:users:write"],
          }),
          items: [mapUserDtoToListItem(userDto(), "en-CA")],
        })}
      />,
    );

    expect(screen.getByRole("link", { name: /create user/i })).toBeVisible();
    expect(screen.getByRole("link", { name: /view details/i })).toBeVisible();
    expect(screen.getByRole("link", { name: /edit/i })).toBeVisible();
  });

  it("shows forbidden state for unauthorized identities", () => {
    render(
      <UserListView
        {...listProps({
          identity: identity(),
          forbidden: true,
          items: [],
        })}
      />,
    );

    expect(screen.getByText(/access denied/i)).toBeVisible();
    expect(screen.queryByRole("link", { name: /create user/i })).toBeNull();
  });
});

function listProps(
  overrides: Partial<Parameters<typeof UserListView>[0]> = {},
) {
  return {
    identity: identity({ roles: ["ADMIN"] }),
    locale: "en-CA" as const,
    items: [mapUserDtoToListItem(userDto(), "en-CA")],
    currentPage: 1,
    pageSize: 20,
    sortField: "updatedAt" as const,
    sortOrder: "desc" as const,
    ...overrides,
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

function pageMetadata(
  overrides: Partial<UserAdminPageMetadata> = {},
): UserAdminPageMetadata {
  return {
    number: 0,
    size: 20,
    totalElements: 21,
    totalPages: 2,
    numberOfElements: 20,
    first: true,
    last: false,
    ...overrides,
  };
}

function userDto(overrides: Partial<AdminUserDto> = {}): AdminUserDto {
  return {
    id: "user_1",
    username: "admin",
    email: "admin@example.test",
    firstName: "Admin",
    lastName: "User",
    active: true,
    accountNonExpired: true,
    accountNonLocked: true,
    credentialsNonExpired: true,
    lastLoginAt: "2026-05-28T12:00:00.000Z",
    lastActivityAt: "2026-05-31T12:00:00.000Z",
    roles: ["ADMIN"],
    permissions: ["admin:users:read"],
    createdAt: "2026-05-29T12:00:00.000Z",
    updatedAt: "2026-05-30T12:00:00.000Z",
    createdBy: "system",
    updatedBy: "admin-updater",
    ...overrides,
  };
}
