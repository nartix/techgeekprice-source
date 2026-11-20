import type { AdminUserDto } from "@tgp/contracts";
import { describe, expect, it } from "vitest";

import {
  mapUserDtoToFormValues,
  mapUserFormValuesToCreateDto,
  mapUserFormValuesToMutationDto,
} from "../mappers/user-admin.mapper";

describe("user admin mapper", () => {
  it("maps records into generated form values", () => {
    expect(mapUserDtoToFormValues(userDto())).toEqual({
      active: true,
      confirmPassword: "",
      email: "admin@example.test",
      firstName: "Admin",
      id: "user_1",
      lastName: "User",
      password: "",
      permissions: ["admin:users:read"],
      roles: ["ADMIN"],
      username: "admin",
    });
  });

  it("maps create form values to accepted backend keys with password", () => {
    const payload = mapUserFormValuesToCreateDto({
      active: true,
      confirmPassword: "secret123",
      email: " admin@example.test ",
      firstName: " ",
      id: "user_1",
      lastName: " User ",
      password: "secret123",
      permissions: ["admin:users:read"],
      roles: ["ADMIN"],
      username: " admin ",
    });

    expect(payload).toEqual({
      active: true,
      email: "admin@example.test",
      firstName: null,
      lastName: "User",
      password: "secret123",
      permissions: ["admin:users:read"],
      roles: ["ADMIN"],
      username: "admin",
    });
    expect(payload).not.toHaveProperty("confirmPassword");
  });

  it("maps update form values to accepted backend mutation keys and excludes password", () => {
    const payload = mapUserFormValuesToMutationDto({
      active: true,
      confirmPassword: "secret123",
      email: " admin@example.test ",
      firstName: " ",
      id: "user_1",
      lastName: " User ",
      password: "secret123",
      permissions: ["admin:users:read"],
      roles: ["ADMIN"],
      username: " admin ",
    });

    expect(payload).toEqual({
      active: true,
      email: "admin@example.test",
      firstName: null,
      lastName: "User",
      permissions: ["admin:users:read"],
      roles: ["ADMIN"],
      username: "admin",
    });
    expect(payload).not.toHaveProperty("password");
    expect(payload).not.toHaveProperty("confirmPassword");
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
