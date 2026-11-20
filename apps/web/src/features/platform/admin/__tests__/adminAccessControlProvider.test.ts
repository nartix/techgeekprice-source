import { afterEach, describe, expect, it } from "vitest";

import { createAdminAccessControlProvider } from "../providers/adminAccessControlProvider";
import {
  clearAdminIdentity,
  setAdminIdentity,
} from "../session/adminIdentityStore";
import type { AdminIdentity } from "../types/admin.types";

describe("adminAccessControlProvider", () => {
  afterEach(() => {
    clearAdminIdentity();
  });

  it("allows admin role access for non-strict resources only", async () => {
    setAdminIdentity(identity({ roles: ["ADMIN"] }));
    const provider = createAdminAccessControlProvider();

    await expect(
      provider.can({ resource: "dashboard", action: "list" }),
    ).resolves.toEqual({
      can: true,
    });
    await expect(
      provider.can({ resource: "users", action: "delete" }),
    ).resolves.toEqual({
      can: true,
    });
    await expect(
      provider.can({ resource: "productCategories", action: "export" }),
    ).resolves.toMatchObject({
      can: false,
      reason: "forbidden",
    });
  });

  it("allows bare moderator dashboard access but no resource access", async () => {
    setAdminIdentity(identity({ roles: ["MODERATOR"] }));
    const provider = createAdminAccessControlProvider();

    await expect(
      provider.can({ resource: undefined, action: "list" }),
    ).resolves.toEqual({
      can: true,
    });
    await expect(
      provider.can({ resource: "users", action: "list" }),
    ).resolves.toMatchObject({
      can: false,
      reason: "forbidden",
    });
    await expect(
      provider.can({ resource: "productCategories", action: "list" }),
    ).resolves.toMatchObject({
      can: false,
      reason: "forbidden",
    });
  });

  it("uses seeded moderator permissions for user read and state actions", async () => {
    setAdminIdentity(
      identity({
        roles: ["MODERATOR"],
        permissions: ["admin:users:read", "admin:users:status"],
        sessionScope: "moderator",
      }),
    );
    const provider = createAdminAccessControlProvider();

    await expect(
      provider.can({ resource: "users", action: "list" }),
    ).resolves.toEqual({ can: true });
    await expect(
      provider.can({ resource: "users", action: "show" }),
    ).resolves.toEqual({ can: true });
    await expect(
      provider.can({ resource: "users", action: "state" }),
    ).resolves.toEqual({ can: true });
    await expect(
      provider.can({ resource: "users", action: "edit" }),
    ).resolves.toMatchObject({
      can: false,
      reason: "forbidden",
    });
    await expect(
      provider.can({ resource: "productCategories", action: "list" }),
    ).resolves.toMatchObject({
      can: false,
      reason: "forbidden",
    });
  });

  it("distinguishes category reader and writer actions", async () => {
    setAdminIdentity(identity({ permissions: ["admin:catalogue-categories:read"] }));
    const provider = createAdminAccessControlProvider();

    await expect(
      provider.can({ resource: "productCategories", action: "list" }),
    ).resolves.toEqual({
      can: true,
    });
    await expect(
      provider.can({ resource: "productCategories", action: "show" }),
    ).resolves.toEqual({
      can: true,
    });
    await expect(
      provider.can({ resource: "productCategories", action: "state" }),
    ).resolves.toMatchObject({
      can: false,
      reason: "forbidden",
    });

    setAdminIdentity(identity({ permissions: ["admin:catalogue-categories:write"] }));

    await expect(
      provider.can({ resource: "productCategories", action: "create" }),
    ).resolves.toEqual({
      can: true,
    });
    await expect(
      provider.can({ resource: "productCategories", action: "move" }),
    ).resolves.toEqual({
      can: true,
    });
    await expect(
      provider.can({ resource: "productCategories", action: "list" }),
    ).resolves.toMatchObject({
      can: false,
      reason: "forbidden",
    });
  });

  it("requires explicit Product Categories permissions for strict resources", async () => {
    setAdminIdentity(identity({ roles: ["ADMIN"] }));
    const provider = createAdminAccessControlProvider();

    await expect(
      provider.can({ resource: "productCategories", action: "list" }),
    ).resolves.toMatchObject({
      can: false,
      reason: "forbidden",
    });

    setAdminIdentity(
      identity({
        roles: ["ADMIN"],
        permissions: ["admin:catalogue-categories:read"],
      }),
    );

    await expect(
      provider.can({ resource: "productCategories", action: "list" }),
    ).resolves.toEqual({ can: true });
    await expect(
      provider.can({ resource: "productCategories", action: "edit" }),
    ).resolves.toMatchObject({
      can: false,
      reason: "forbidden",
    });

    setAdminIdentity(
      identity({
        permissions: [
          "admin:catalogue-categories:read",
          "admin:catalogue-categories:write",
        ],
      }),
    );

    await expect(
      provider.can({ resource: "productCategories", action: "move" }),
    ).resolves.toEqual({ can: true });
  });

  it("allows user status without full user edit permission", async () => {
    setAdminIdentity(identity({ permissions: ["admin:users:status"] }));
    const provider = createAdminAccessControlProvider();

    await expect(
      provider.can({ resource: "users", action: "state" }),
    ).resolves.toEqual({
      can: true,
    });
    await expect(
      provider.can({ resource: "users", action: "edit" }),
    ).resolves.toMatchObject({
      can: false,
      reason: "forbidden",
    });
  });

  it("maps unknown actions to custom and denies them unless admin", async () => {
    setAdminIdentity(identity({ permissions: ["admin:users:write"] }));
    const provider = createAdminAccessControlProvider();

    await expect(
      provider.can({ resource: "users", action: "archive" }),
    ).resolves.toMatchObject({
      can: false,
      reason: "forbidden",
    });
  });

  it("returns forbidden without an identity", async () => {
    const provider = createAdminAccessControlProvider();

    await expect(
      provider.can({ resource: "productCategories", action: "list" }),
    ).resolves.toMatchObject({
      can: false,
      reason: "unauthenticated",
    });
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
