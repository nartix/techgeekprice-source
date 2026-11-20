import { describe, expect, it, vi } from "vitest";

import {
  render,
  screen,
  userEvent,
} from "../../../../../../tests/test-utils/render";
import type { AdminFormOptionLoaderApi } from "../../../../platform/admin/forms";
import { UserFormView } from "../components/UserForm";
import { emptyUserAdminFormValues } from "../mappers/user-admin.mapper";

describe("UserFormView", () => {
  it("validates required fields and submits with matching password confirmation", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(<UserFormView mode="create" onSubmit={onSubmit} />);

    await user.click(screen.getByRole("button", { name: /create user/i }));

    expect(await screen.findByText(/enter a username/i)).toBeVisible();
    expect(screen.getByText(/enter an email address/i)).toBeVisible();
    expect(screen.getByText(/enter a password/i)).toBeVisible();
    expect(screen.getByText(/confirm the password/i)).toBeVisible();
    expect(onSubmit).not.toHaveBeenCalled();

    await user.type(
      screen.getByRole("textbox", { name: /^username/i }),
      "admin",
    );
    await user.type(
      screen.getByRole("textbox", { name: /^email/i }),
      "admin@example.test",
    );
    await user.type(screen.getByLabelText(/^password/i), "secret123");
    await user.type(screen.getByLabelText(/^confirm password/i), "secret123");
    await user.click(screen.getByRole("button", { name: /create user/i }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        username: "admin",
        email: "admin@example.test",
        password: "secret123",
      }),
    );
    expect(onSubmit).toHaveBeenCalledWith(
      expect.not.objectContaining({
        confirmPassword: expect.anything(),
      }),
    );
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("blocks mismatched password confirmation on create", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(<UserFormView mode="create" onSubmit={onSubmit} />);

    await user.type(
      screen.getByRole("textbox", { name: /^username/i }),
      "admin",
    );
    await user.type(
      screen.getByRole("textbox", { name: /^email/i }),
      "admin@example.test",
    );
    await user.type(screen.getByLabelText(/^password/i), "secret123");
    await user.type(
      screen.getByLabelText(/^confirm password/i),
      "different123",
    );
    await user.click(screen.getByRole("button", { name: /create user/i }));

    expect(await screen.findByText(/passwords must match/i)).toBeVisible();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("renders backend role and permission options with create password submission", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    const api = createOptionApi();

    render(<UserFormView mode="create" api={api} onSubmit={onSubmit} />);

    expect(screen.getByLabelText(/^password/i)).toBeVisible();

    await user.click(screen.getByRole("textbox", { name: /^username/i }));
    await user.keyboard("admin");
    await user.click(screen.getByRole("textbox", { name: /^email/i }));
    await user.keyboard("admin@example.test");
    await user.type(screen.getByLabelText(/^password/i), "secret123");
    await user.type(screen.getByLabelText(/^confirm password/i), "secret123");
    await user.click(screen.getByRole("combobox", { name: /^roles/i }));
    await user.click(
      await screen.findByRole("option", { name: /^administrator \(admin\)$/i }),
    );
    await user.click(screen.getByRole("combobox", { name: /^permissions/i }));
    await user.click(
      await screen.findByRole("option", {
        name: /^read admin users \(admin:users:read\)$/i,
      }),
    );
    await user.click(screen.getByRole("button", { name: /create user/i }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        password: "secret123",
      }),
    );
    expect(onSubmit).toHaveBeenCalledWith(
      expect.not.objectContaining({
        confirmPassword: expect.anything(),
      }),
    );
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        permissions: ["admin:users:read"],
        roles: ["ADMIN"],
      }),
    );
    expect(api.custom).toHaveBeenCalledWith(
      expect.objectContaining({
        query: expect.objectContaining({
          active: true,
          size: 100,
          sort: ["code,asc"],
        }),
        url: "/api/v1/admin/roles",
      }),
    );
    expect(api.custom).toHaveBeenCalledWith(
      expect.objectContaining({
        method: "get",
        query: expect.objectContaining({
          active: true,
          page: 0,
          size: 50,
          sort: ["resource,asc", "action,asc", "code,asc"],
        }),
        url: "/api/v1/admin/permissions",
      }),
    );
  });

  it("does not render or submit password on edit", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(
      <UserFormView
        mode="edit"
        initialValues={{
          ...emptyUserAdminFormValues,
          username: "admin",
          email: "admin@example.test",
        }}
        onSubmit={onSubmit}
      />,
    );

    expect(screen.queryByLabelText(/^password/i)).toBeNull();
    expect(screen.queryByLabelText(/^confirm password/i)).toBeNull();

    await user.click(screen.getByRole("button", { name: /save user/i }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.not.objectContaining({ password: expect.anything() }),
    );
    expect(onSubmit).toHaveBeenCalledWith(
      expect.not.objectContaining({ confirmPassword: expect.anything() }),
    );
  });

  it("preserves loaded roles and permissions on username-only edits", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(
      <UserFormView
        mode="edit"
        initialValues={{
          ...emptyUserAdminFormValues,
          username: "admin",
          email: "admin@example.test",
          roles: ["ADMIN"],
          permissions: ["admin:users:read", "admin:users:write"],
        }}
        onSubmit={onSubmit}
      />,
    );

    await user.clear(screen.getByRole("textbox", { name: /^username/i }));
    await user.type(
      screen.getByRole("textbox", { name: /^username/i }),
      "renamed-admin",
    );
    await user.click(screen.getByRole("button", { name: /save user/i }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        permissions: ["admin:users:read", "admin:users:write"],
        roles: ["ADMIN"],
        username: "renamed-admin",
      }),
    );
  });

  it("maps USER_ALREADY_EXISTS to safe root feedback", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn(async () => {
      throw {
        details: {
          code: "USER_ALREADY_EXISTS",
          fieldErrors: [],
          message: "User already exists.",
          path: "/api/v1/admin/users",
          timestamp: "2026-06-04T00:00:00Z",
        },
      };
    });

    render(<UserFormView mode="create" onSubmit={onSubmit} />);

    await user.type(
      screen.getByRole("textbox", { name: /^username/i }),
      "admin",
    );
    await user.type(
      screen.getByRole("textbox", { name: /^email/i }),
      "duplicate@example.test",
    );
    await user.type(screen.getByLabelText(/^password/i), "secret123");
    await user.type(screen.getByLabelText(/^confirm password/i), "secret123");
    await user.click(screen.getByRole("button", { name: /create user/i }));

    expect(await screen.findByText("User already exists.")).toBeVisible();
  });

  it("shows admin access denials as form feedback", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn(async () => {
      throw {
        details: {
          code: "ADMIN_ACCESS_DENIED",
          fieldErrors: [],
          message: "Admin access is denied",
          path: "/api/v1/admin/users/user_1",
          timestamp: "2026-06-06T07:11:17.006Z",
        },
        status: 403,
      };
    });

    render(
      <UserFormView
        mode="edit"
        initialValues={{
          ...emptyUserAdminFormValues,
          username: "admin",
          email: "admin@example.test",
        }}
        onSubmit={onSubmit}
      />,
    );

    await user.click(screen.getByRole("button", { name: /save user/i }));

    expect(
      await screen.findByText(
        "You do not have permission to use this admin workflow.",
      ),
    ).toBeVisible();
    expect(
      screen.queryByText("Admin access is denied"),
    ).not.toBeInTheDocument();
  });

  it("shows disabled, safe feedback, and conflict reload states", async () => {
    const user = userEvent.setup();
    const onReloadLatest = vi.fn();

    render(
      <UserFormView
        mode="edit"
        loading
        formError="Review the user fields and try again."
        successMessage="The user was updated."
        conflict
        onReloadLatest={onReloadLatest}
        initialValues={{
          ...emptyUserAdminFormValues,
          username: "admin",
          email: "admin@example.test",
        }}
        onSubmit={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: /save user/i })).toBeDisabled();
    expect(screen.getByText(/review the user fields/i)).toBeVisible();
    expect(screen.getByText(/the user was updated/i)).toBeVisible();
    await user.click(screen.getByRole("button", { name: /reload latest/i }));
    expect(onReloadLatest).toHaveBeenCalled();
  });
});

function createOptionApi(): AdminFormOptionLoaderApi {
  const custom = vi.fn(
    async ({ url }: Parameters<AdminFormOptionLoaderApi["custom"]>[0]) => {
      if (url === "/api/v1/admin/roles") {
        return {
          data: [
            {
              active: true,
              code: "ADMIN",
              description: "Default administrator role",
              id: "1",
              name: "Administrator",
            },
          ],
          page: {
            first: true,
            last: true,
            number: 0,
            numberOfElements: 1,
            size: 100,
            totalElements: 1,
            totalPages: 1,
          },
          sort: [{ direction: "ASC", property: "code" }],
        };
      }

      return {
        data: [
          {
            action: "read",
            active: true,
            code: "admin:users:read",
            description: "Allows reading user records",
            id: "10",
            name: "Read admin users",
            resource: "admin-users",
          },
        ],
        page: {
          first: true,
          last: true,
          number: 0,
          numberOfElements: 1,
          size: 50,
          totalElements: 1,
          totalPages: 1,
        },
        sort: [{ direction: "ASC", property: "code" }],
      };
    },
  );

  return {
    loadOptions: vi.fn(async () => []),
    custom: custom as unknown as AdminFormOptionLoaderApi["custom"],
  };
}
