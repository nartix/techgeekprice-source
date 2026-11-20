import type { AdminUserDto } from "@tgp/contracts";
import { describe, expect, it } from "vitest";

import { mapUserDtoToDetailViewModel } from "../mappers/user-admin-detail.mapper";

describe("user admin detail mapper", () => {
  it("maps safe display fields and summaries without carrying raw sensitive fields", () => {
    const viewModel = mapUserDtoToDetailViewModel(
      userDto({
        roles: ["ADMIN", "SUPPORT"],
        permissions: ["admin:users:read", "admin:users:write"],
      }),
      "en-CA",
    );

    expect(viewModel).toMatchObject({
      active: true,
      displayName: "Admin User",
      email: "admin@example.test",
      id: "user_1",
      permissionsLabel: "admin:users:read, admin:users:write",
      rolesLabel: "ADMIN, SUPPORT",
      username: "admin",
    });
    expect(viewModel).not.toHaveProperty("password");
    expect(viewModel).not.toHaveProperty("token");
    expect(viewModel).not.toHaveProperty("dto");
  });

  it("uses empty summaries and fallback display names consistently", () => {
    const viewModel = mapUserDtoToDetailViewModel(
      userDto({
        firstName: null,
        lastName: null,
        roles: [],
        permissions: [],
      }),
      "en-CA",
    );

    expect(viewModel.displayName).toBe("admin");
    expect(viewModel.rolesLabel).toBe("");
    expect(viewModel.permissionsLabel).toBe("");
  });
});

function userDto(overrides: Partial<AdminUserDto> = {}): AdminUserDto {
  return {
    accountNonExpired: true,
    accountNonLocked: true,
    active: true,
    createdAt: "2026-05-29T12:00:00.000Z",
    createdBy: "system",
    credentialsNonExpired: true,
    email: "admin@example.test",
    firstName: "Admin",
    id: "user_1",
    lastActivityAt: null,
    lastLoginAt: null,
    lastName: "User",
    permissions: ["admin:users:read"],
    roles: ["ADMIN"],
    updatedAt: "2026-05-30T12:00:00.000Z",
    updatedBy: "system",
    username: "admin",
    ...overrides,
  };
}
