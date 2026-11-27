import { describe, expect, it } from "vitest";

import frCa from "../../../../../messages/fr-CA.json";
import { render, screen, within } from "../../../../../tests/test-utils/render";
import { AdminDashboardHome } from "../components/AdminDashboardHome";
import type { AdminIdentity } from "../types/admin.types";

const identity: AdminIdentity = {
  id: "dashboard-reader",
  username: "reader",
  roles: [],
  permissions: [
    "admin:access",
    "admin:catalogue-categories:read",
    "admin:users:read",
  ],
  sessionScope: "admin",
};

describe("AdminDashboardHome", () => {
  it("groups accessible resource links and limits cards to readable resources", () => {
    render(<AdminDashboardHome identity={identity} locale="en-CA" />);
    expect(
      screen.getByRole("heading", { name: "Overview", level: 1 }),
    ).toBeVisible();
    const catalogue = screen.getByRole("region", {
      name: "Catalogue management",
    });
    const categories = within(catalogue).getByRole("link", {
      name: "Product Categories",
    });
    expect(categories).toHaveAttribute(
      "href",
      "/en-CA/admin/products/categories",
    );
    expect(categories).toHaveAccessibleDescription(/categories/i);
    expect(within(catalogue).getAllByRole("link")).toHaveLength(1);
    expect(screen.getByRole("link", { name: "Users" })).toHaveAttribute(
      "href",
      "/en-CA/admin/users",
    );
    expect(screen.getAllByRole("link")).toHaveLength(2);
  });

  it("shows an empty workspace without empty resource sections", () => {
    render(
      <AdminDashboardHome
        identity={{ ...identity, permissions: ["admin:access"] }}
        locale="en-CA"
      />,
    );
    expect(screen.getByText(/no resources/i)).toBeVisible();
    expect(screen.queryByRole("region")).toBeNull();
    expect(screen.queryByRole("link")).toBeNull();
  });

  it("uses localized labels and routes", () => {
    render(<AdminDashboardHome identity={identity} locale="fr-CA" />, {
      locale: "fr-CA",
      messages: frCa,
    });
    expect(
      screen.getByRole("link", { name: "Catégories de produits" }),
    ).toHaveAttribute("href", "/fr-CA/admin/products/categories");
  });
});
