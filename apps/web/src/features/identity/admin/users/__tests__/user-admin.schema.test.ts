import { describe, expect, it } from "vitest";

import { createUserAdminSchema } from "../schemas/user-admin.schema";

const messages = {
  emailInvalid: "Use a valid email address.",
  emailRequired: "Enter an email address.",
  emailSize: "Email is too long.",
  firstNameSize: "First name is too long.",
  lastNameSize: "Last name is too long.",
  passwordRequired: "Enter a password.",
  passwordSize: "Password must be between 8 and 128 characters.",
  passwordConfirmationRequired: "Confirm the password.",
  passwordConfirmationMismatch: "Passwords must match.",
  permissionsSize: "Too many permissions.",
  rolesSize: "Too many roles.",
  usernameRequired: "Enter a username.",
  usernameSize: "Username is too long.",
};

describe("user admin schema", () => {
  it("accepts backend-aligned admin user values", () => {
    const schema = createUserAdminSchema(messages);

    expect(
      schema.parse({
        active: true,
        email: "admin@example.test",
        confirmPassword: "secret123",
        firstName: "Admin",
        lastName: "User",
        password: "secret123",
        permissions: ["admin:users:read"],
        roles: ["ADMIN"],
        username: "admin",
      }),
    ).toMatchObject({
      email: "admin@example.test",
      roles: ["ADMIN"],
    });
  });

  it("rejects invalid email and oversized role and permission arrays", () => {
    const schema = createUserAdminSchema(messages);
    const result = schema.safeParse({
      active: true,
      email: "not-an-email",
      confirmPassword: "",
      firstName: "",
      lastName: "",
      permissions: Array.from({ length: 201 }, (_, index) => `perm:${index}`),
      roles: Array.from({ length: 51 }, (_, index) => `ROLE_${index}`),
      username: "",
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues.map((issue) => issue.path.join("."))).toEqual(
      expect.arrayContaining(["email", "permissions", "roles", "username"]),
    );
  });

  it("requires backend-aligned password values on create", () => {
    const schema = createUserAdminSchema(messages, { mode: "create" });

    const missing = schema.safeParse({
      active: true,
      email: "admin@example.test",
      confirmPassword: "",
      firstName: "",
      lastName: "",
      password: "        ",
      permissions: [],
      roles: [],
      username: "admin",
    });
    const short = schema.safeParse({
      active: true,
      email: "admin@example.test",
      confirmPassword: "short",
      firstName: "",
      lastName: "",
      password: "short",
      permissions: [],
      roles: [],
      username: "admin",
    });

    expect(missing.success).toBe(false);
    expect(missing.error?.issues[0]?.message).toBe("Enter a password.");
    expect(short.success).toBe(false);
    expect(short.error?.issues[0]?.message).toBe(
      "Password must be between 8 and 128 characters.",
    );
  });

  it("requires matching password confirmation on create", () => {
    const schema = createUserAdminSchema(messages, { mode: "create" });

    const missing = schema.safeParse({
      active: true,
      email: "admin@example.test",
      confirmPassword: "",
      firstName: "",
      lastName: "",
      password: "secret123",
      permissions: [],
      roles: [],
      username: "admin",
    });
    const mismatched = schema.safeParse({
      active: true,
      email: "admin@example.test",
      confirmPassword: "different123",
      firstName: "",
      lastName: "",
      password: "secret123",
      permissions: [],
      roles: [],
      username: "admin",
    });

    expect(missing.success).toBe(false);
    expect(missing.error?.issues[0]?.message).toBe("Confirm the password.");
    expect(mismatched.success).toBe(false);
    expect(
      mismatched.error?.issues.map((issue) => issue.path.join(".")),
    ).toContain("confirmPassword");
    expect(mismatched.error?.issues.map((issue) => issue.message)).toContain(
      "Passwords must match.",
    );
  });

  it("does not require password values on edit", () => {
    const schema = createUserAdminSchema(messages, { mode: "edit" });

    expect(
      schema.safeParse({
        active: true,
        confirmPassword: "",
        email: "admin@example.test",
        firstName: "",
        lastName: "",
        permissions: [],
        roles: [],
        username: "admin",
      }).success,
    ).toBe(true);
  });
});
