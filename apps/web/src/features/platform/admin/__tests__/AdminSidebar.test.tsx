import { beforeEach, describe, expect, it, vi } from "vitest";

import frCaMessages from "../../../../../messages/fr-CA.json";
import {
  render,
  screen,
  userEvent,
} from "../../../../../tests/test-utils/render";
import { AdminSidebar } from "../components/AdminSidebar";
import type { AdminIdentity } from "../types/admin.types";

const pathnameMock = vi.hoisted(() => ({ value: "/admin" }));

vi.mock("../../../../i18n/navigation", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("../../../../i18n/navigation")>();

  return {
    ...actual,
    usePathname: () => pathnameMock.value,
  };
});

describe("AdminSidebar", () => {
  beforeEach(() => {
    pathnameMock.value = "/admin";
  });

  it("shows non-strict navigation for admins", () => {
    render(
      <AdminSidebar
        identity={identity({ roles: ["ADMIN"] })}
        locale="en-CA"
      />,
    );

    expect(screen.getByText("General")).toBeVisible();
    expect(screen.getByText("Pages")).toBeVisible();
    expect(screen.getByRole("link", { name: /dashboard/i })).toHaveAttribute(
      "href",
      "/en-CA/admin",
    );
    expect(
      screen.queryByRole("link", { name: /^product categories$/i }),
    ).toBeNull();
    expect(screen.getByRole("link", { name: /users/i })).toBeVisible();
  });

  it("shows Product Categories under Products for catalogue readers", () => {
    pathnameMock.value = "/admin/products/categories";

    render(
      <AdminSidebar
        identity={identity({
          permissions: ["admin:access", "admin:catalogue-categories:read"],
        })}
        locale="en-CA"
      />,
    );

    expect(screen.getByText("Products")).toBeVisible();
    expect(
      screen.getByRole("link", { name: /^product categories$/i }),
    ).toHaveAttribute("href", "/en-CA/admin/products/categories");
    expect(
      screen.getByRole("link", { name: /^product categories$/i }),
    ).toHaveAttribute("data-active");
    expect(screen.queryByRole("link", { name: /^categories$/i })).toBeNull();
  });

  it("hides Product Categories for admin-role-only identities", () => {
    render(
      <AdminSidebar
        identity={identity({ roles: ["ADMIN"] })}
        locale="en-CA"
      />,
    );

    expect(
      screen.queryByRole("link", { name: /^product categories$/i }),
    ).toBeNull();
  });

  it("shows Product Categories for catalogue read-write identities", () => {
    render(
      <AdminSidebar
        identity={identity({
          permissions: [
            "admin:access",
            "admin:catalogue-categories:read",
            "admin:catalogue-categories:write",
          ],
        })}
        locale="en-CA"
      />,
    );

    expect(
      screen.getByRole("link", { name: /^product categories$/i }),
    ).toBeVisible();
  });

  it("shows seeded moderators the dashboard and user list only", () => {
    render(
      <AdminSidebar
        identity={identity({
          roles: ["MODERATOR"],
          permissions: ["admin:users:read", "admin:users:status"],
          sessionScope: "moderator",
        })}
        locale="en-CA"
      />,
    );

    expect(screen.getByRole("link", { name: /dashboard/i })).toBeVisible();
    expect(screen.getByRole("link", { name: /users/i })).toBeVisible();
    expect(
      screen.queryByRole("link", { name: /^product categories$/i }),
    ).toBeNull();
  });

  it("shows bare moderators only the dashboard shell", () => {
    render(
      <AdminSidebar
        identity={identity({
          roles: ["MODERATOR"],
          permissions: [],
          sessionScope: "moderator",
        })}
        locale="fr-CA"
      />,
      { locale: "fr-CA", messages: frCaMessages },
    );

    expect(
      screen.getByRole("link", { name: /tableau de bord/i }),
    ).toBeVisible();
    expect(screen.getByText("Général")).toBeVisible();
    expect(screen.queryByText("Pages")).toBeNull();
    expect(screen.queryByRole("link", { name: /catégories/i })).toBeNull();
    expect(screen.queryByRole("link", { name: /utilisateurs/i })).toBeNull();
  });

  it("does not show write-only resources in list navigation", () => {
    render(
      <AdminSidebar
        identity={identity({
          permissions: ["admin:access", "admin:catalogue-categories:write"],
        })}
        locale="en-CA"
      />,
    );

    expect(screen.getByRole("link", { name: /dashboard/i })).toBeVisible();
    expect(
      screen.queryByRole("link", { name: /^product categories$/i }),
    ).toBeNull();
    expect(screen.queryByRole("link", { name: /users/i })).toBeNull();
  });

  it("highlights the matching section for nested admin routes", () => {
    pathnameMock.value = "/admin/users/create";

    render(
      <AdminSidebar
        identity={identity({
          permissions: [
            "admin:access",
            "admin:users:read",
            "admin:catalogue-categories:read",
            "admin:catalogue-categories:write",
          ],
        })}
        locale="en-CA"
      />,
    );

    expect(screen.getByRole("link", { name: /dashboard/i })).not.toHaveAttribute(
      "data-active",
    );
    expect(screen.getByRole("link", { name: /users/i })).toHaveAttribute(
      "data-active",
    );
  });

  it("supports keyboard navigation", async () => {
    const user = userEvent.setup();
    const onCollapseToggle = vi.fn();
    const onNavigate = vi.fn();

    render(
      <AdminSidebar
        collapsed={false}
        identity={identity({ roles: ["ADMIN"] })}
        locale="en-CA"
        onCollapseToggle={onCollapseToggle}
        onNavigate={onNavigate}
      />,
    );

    await user.tab();
    expect(
      screen.getByRole("button", { name: /collapse sidebar/i }),
    ).toHaveFocus();

    await user.keyboard("{Enter}");
    expect(onCollapseToggle).toHaveBeenCalled();

    await user.tab();
    expect(screen.getByRole("link", { name: /dashboard/i })).toHaveFocus();

    await user.keyboard("{Enter}");
    expect(onNavigate).toHaveBeenCalled();
  });

  it("collapses navigation to accessible icon-only links", async () => {
    const user = userEvent.setup();
    const onCollapseToggle = vi.fn();

    render(
      <AdminSidebar
        collapsed
        identity={identity({
          permissions: [
            "admin:access",
            "admin:catalogue-categories:read",
            "admin:catalogue-categories:write",
          ],
        })}
        locale="en-CA"
        logoutAction={<button type="button">Sign out</button>}
        onCollapseToggle={onCollapseToggle}
      />,
    );

    expect(
      screen.getByRole("button", { name: /expand sidebar/i }),
    ).toHaveAttribute("aria-expanded", "false");
    expect(
      screen.getByRole("link", { name: /^product categories$/i }),
    ).toBeVisible();
    expect(
      screen.getByRole("button", { name: /open account menu for admin/i }),
    ).toBeVisible();
    expect(screen.queryByText("General")).toBeNull();
    expect(screen.queryByText("Pages")).toBeNull();
    expect(screen.queryByText("Product Categories")).toBeNull();
    expect(screen.queryByText("ADMIN")).toBeNull();

    await user.click(screen.getByRole("button", { name: /expand sidebar/i }));
    expect(onCollapseToggle).toHaveBeenCalled();
  });

  it("renders signed-in user info at the bottom of the expanded sidebar", () => {
    render(
      <AdminSidebar identity={identity({ roles: ["ADMIN"] })} locale="en-CA" />,
    );

    expect(screen.getByText("admin", { exact: true })).toBeVisible();
    expect(screen.getByText("ADMIN", { exact: true })).toBeVisible();
  });

  it("opens a single logout action from the user info popover", async () => {
    const user = userEvent.setup();

    render(
      <AdminSidebar
        identity={identity({ roles: ["ADMIN"] })}
        locale="en-CA"
        logoutAction={<button type="button">Sign out</button>}
      />,
    );

    expect(screen.queryByRole("button", { name: /sign out/i })).toBeNull();

    await user.click(
      screen.getByRole("button", { name: /open account menu for admin/i }),
    );

    expect(screen.getByRole("button", { name: /sign out/i })).toBeVisible();
  });

  it("does not render logout at the bottom of the sidebar", () => {
    render(
      <AdminSidebar identity={identity({ roles: ["ADMIN"] })} locale="en-CA" />,
    );

    expect(screen.queryByRole("button", { name: /sign out/i })).toBeNull();
  });
});

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
