import type { components } from "../generated/spring";

/** Generated fields with documented compatibility refinements; see openapi/README.md. */
export type AdminUserDto = Omit<
  Required<
    Pick<
      components["schemas"]["AdminUserResponse"],
      | "id"
      | "username"
      | "email"
      | "firstName"
      | "lastName"
      | "active"
      | "accountNonExpired"
      | "accountNonLocked"
      | "credentialsNonExpired"
      | "lastLoginAt"
      | "lastActivityAt"
      | "roles"
      | "permissions"
      | "createdAt"
      | "updatedAt"
      | "createdBy"
      | "updatedBy"
    >
  >,
  | "firstName"
  | "lastName"
  | "lastLoginAt"
  | "lastActivityAt"
  | "roles"
  | "permissions"
  | "createdBy"
  | "updatedBy"
> & {
  firstName?: NonNullable<
    components["schemas"]["AdminUserResponse"]["firstName"]
  > | null;
  lastName?: NonNullable<
    components["schemas"]["AdminUserResponse"]["lastName"]
  > | null;
  lastLoginAt?: NonNullable<
    components["schemas"]["AdminUserResponse"]["lastLoginAt"]
  > | null;
  lastActivityAt?: NonNullable<
    components["schemas"]["AdminUserResponse"]["lastActivityAt"]
  > | null;
  roles?: NonNullable<components["schemas"]["AdminUserResponse"]["roles"]>;
  permissions?: NonNullable<
    components["schemas"]["AdminUserResponse"]["permissions"]
  >;
  createdBy?: NonNullable<
    components["schemas"]["AdminUserResponse"]["createdBy"]
  > | null;
  updatedBy?: NonNullable<
    components["schemas"]["AdminUserResponse"]["updatedBy"]
  > | null;
};

/** Generated fields with documented compatibility refinements; see openapi/README.md. */
export type AdminUserMutationDto = Omit<
  Required<
    Pick<
      components["schemas"]["AdminUserMutationRequest"],
      | "username"
      | "email"
      | "firstName"
      | "lastName"
      | "active"
      | "roles"
      | "permissions"
    >
  >,
  "firstName" | "lastName" | "roles" | "permissions"
> & {
  firstName?: NonNullable<
    components["schemas"]["AdminUserMutationRequest"]["firstName"]
  > | null;
  lastName?: NonNullable<
    components["schemas"]["AdminUserMutationRequest"]["lastName"]
  > | null;
  roles?: NonNullable<
    components["schemas"]["AdminUserMutationRequest"]["roles"]
  >;
  permissions?: NonNullable<
    components["schemas"]["AdminUserMutationRequest"]["permissions"]
  >;
};

export type AdminUserCreateDto = AdminUserMutationDto &
  Pick<components["schemas"]["AdminCreateUserRequest"], "password">;
