import { describe, expect, it } from "vitest";

import {
  canAccessAdminDashboard,
  canPerformAdminAction,
  decideAdminAccess,
} from "../utils/adminPermissions";
import type { AdminIdentity } from "../types/admin.types";

describe("adminPermissions", () => {
  it("allows admin role across configured and unconfigured actions", () => {
    const admin = identity({ roles: ["ADMIN"] });

    expect(canAccessAdminDashboard(admin)).toBe(true);
    expect(canPerformAdminAction(admin, "dashboard", "list")).toBe(true);
    expect(canPerformAdminAction(admin, "users", "list")).toBe(true);
    expect(canPerformAdminAction(admin, "users", "show")).toBe(true);
    expect(canPerformAdminAction(admin, "users", "create")).toBe(true);
    expect(canPerformAdminAction(admin, "users", "edit")).toBe(true);
    expect(canPerformAdminAction(admin, "users", "delete")).toBe(true);
    expect(canPerformAdminAction(admin, "users", "state")).toBe(true);
    expect(canPerformAdminAction(admin, "users", "export")).toBe(true);
  });

  it("allows bare moderator dashboard access only", () => {
    const bareModerator = identity({ roles: ["MODERATOR"] });

    expect(canPerformAdminAction(bareModerator, "dashboard", "list")).toBe(
      true,
    );
    expect(canPerformAdminAction(bareModerator, "users", "list")).toBe(false);
    expect(canPerformAdminAction(bareModerator, "users", "state")).toBe(false);
    expect(canPerformAdminAction(bareModerator, "productCategories", "list")).toBe(
      false,
    );
    expect(decideAdminAccess(bareModerator, "users", "list")).toEqual({
      can: false,
      reason: "forbidden",
    });
  });

  it("uses returned permissions for seeded moderator feature actions", () => {
    const seededModerator = identity({
      roles: ["MODERATOR"],
      permissions: ["admin:users:read", "admin:users:status"],
      sessionScope: "moderator",
    });

    expect(canPerformAdminAction(seededModerator, "dashboard", "list")).toBe(
      true,
    );
    expect(canPerformAdminAction(seededModerator, "users", "list")).toBe(true);
    expect(canPerformAdminAction(seededModerator, "users", "show")).toBe(true);
    expect(canPerformAdminAction(seededModerator, "users", "state")).toBe(true);
    expect(canPerformAdminAction(seededModerator, "users", "create")).toBe(
      false,
    );
    expect(canPerformAdminAction(seededModerator, "users", "edit")).toBe(false);
    expect(canPerformAdminAction(seededModerator, "users", "delete")).toBe(
      false,
    );
    expect(canPerformAdminAction(seededModerator, "productCategories", "list")).toBe(
      false,
    );
    expect(canPerformAdminAction(seededModerator, "productCategories", "state")).toBe(
      false,
    );
  });

  it("allows admin access permission for dashboard only", () => {
    const accessOnly = identity({ permissions: ["admin:access"] });

    expect(canPerformAdminAction(accessOnly, "dashboard", "list")).toBe(true);
    expect(canPerformAdminAction(accessOnly, "users", "list")).toBe(false);
  });

  it("distinguishes users read, write, and status actions", () => {
    const reader = identity({ permissions: ["admin:users:read"] });
    const statusOnly = identity({ permissions: ["admin:users:status"] });

    expect(canPerformAdminAction(reader, "users", "list")).toBe(true);
    expect(canPerformAdminAction(reader, "users", "show")).toBe(true);
    expect(canPerformAdminAction(reader, "users", "edit")).toBe(false);
    expect(canPerformAdminAction(reader, "users", "delete")).toBe(false);
    expect(canPerformAdminAction(reader, "users", "state")).toBe(false);
    expect(canPerformAdminAction(statusOnly, "users", "state")).toBe(true);
    expect(canPerformAdminAction(statusOnly, "users", "edit")).toBe(false);
    expect(canPerformAdminAction(statusOnly, "users", "delete")).toBe(false);
    expect(canPerformAdminAction(statusOnly, "users", "list")).toBe(false);
  });

  it("does not let category write imply category read", () => {
    const categoryWriter = identity({
      permissions: ["admin:catalogue-categories:write"],
    });

    expect(canPerformAdminAction(categoryWriter, "productCategories", "create")).toBe(
      true,
    );
    expect(canPerformAdminAction(categoryWriter, "productCategories", "edit")).toBe(
      true,
    );
    expect(canPerformAdminAction(categoryWriter, "productCategories", "delete")).toBe(
      true,
    );
    expect(canPerformAdminAction(categoryWriter, "productCategories", "move")).toBe(
      true,
    );
    expect(canPerformAdminAction(categoryWriter, "productCategories", "state")).toBe(
      true,
    );
    expect(canPerformAdminAction(categoryWriter, "productCategories", "list")).toBe(
      false,
    );
    expect(canPerformAdminAction(categoryWriter, "productCategories", "show")).toBe(
      false,
    );
  });

  it("requires explicit catalogue permissions for strict Product Categories", () => {
    const adminRoleOnly = identity({ roles: ["ADMIN"] });
    const readOnly = identity({
      roles: ["ADMIN"],
      permissions: ["admin:catalogue-categories:read"],
    });
    const readWrite = identity({
      permissions: [
        "admin:catalogue-categories:read",
        "admin:catalogue-categories:write",
      ],
    });

    expect(
      canPerformAdminAction(adminRoleOnly, "productCategories", "list"),
    ).toBe(false);
    expect(
      canPerformAdminAction(adminRoleOnly, "productCategories", "create"),
    ).toBe(false);
    expect(canPerformAdminAction(readOnly, "productCategories", "list")).toBe(
      true,
    );
    expect(canPerformAdminAction(readOnly, "productCategories", "show")).toBe(
      true,
    );
    expect(canPerformAdminAction(readOnly, "productCategories", "edit")).toBe(
      false,
    );
    expect(canPerformAdminAction(readOnly, "productCategories", "move")).toBe(
      false,
    );
    expect(canPerformAdminAction(readOnly, "productCategories", "state")).toBe(
      false,
    );
    expect(canPerformAdminAction(readWrite, "productCategories", "list")).toBe(
      true,
    );
    expect(canPerformAdminAction(readWrite, "productCategories", "edit")).toBe(
      true,
    );
    expect(canPerformAdminAction(readWrite, "productCategories", "delete")).toBe(
      true,
    );
  });

  it("denies missing action metadata for non-admin identities", () => {
    const userWriter = identity({ permissions: ["admin:users:write"] });

    expect(canPerformAdminAction(userWriter, "users", "export")).toBe(false);
    expect(canPerformAdminAction(userWriter, "users", "custom")).toBe(false);
  });

  it("delegates admin access decisions through the action helper", () => {
    expect(decideAdminAccess(null, "dashboard", "list")).toEqual({
      can: false,
      reason: "unauthenticated",
    });
    expect(decideAdminAccess(identity(), "dashboard", "list")).toEqual({
      can: false,
      reason: "forbidden",
    });
    expect(
      decideAdminAccess(
        identity({ permissions: ["admin:users:status"] }),
        "users",
        "state",
      ),
    ).toEqual({ can: true });
  });
});

function identity(overrides: Partial<AdminIdentity> = {}): AdminIdentity {
  return {
    id: "identity_1",
    username: "admin",
    roles: [],
    permissions: [],
    sessionScope: "admin",
    ...overrides,
  };
}
