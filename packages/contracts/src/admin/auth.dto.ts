import type { components } from "../generated/spring";

export type AdminRoleDto = "ADMIN" | "MODERATOR" | (string & {});
export type AdminPermissionDto =
  | "admin:access"
  | "admin:users:read"
  | "admin:users:status"
  | "admin:users:write"
  | "admin:products:read"
  | "admin:products:write"
  | "admin:products:moderate"
  | "admin:catalogue-categories:read"
  | "admin:catalogue-categories:write"
  | (string & {});

/** Generated fields with documented compatibility refinements; see openapi/README.md. */
export type AdminIdentityDto = Omit<
  Required<components["schemas"]["SessionIdentityResponse"]>,
  "id" | "sessionScope"
> & {
  id: string;
  sessionScope: "admin" | "moderator" | (string & {});
};

/** Generated fields with documented compatibility refinements; see openapi/README.md. */
export type AdminCsrfTokenDto = Omit<
  Required<
    Pick<
      components["schemas"]["CsrfTokenResponse"],
      "token" | "headerName" | "parameterName"
    >
  >,
  "parameterName"
> & {
  parameterName?: NonNullable<
    components["schemas"]["CsrfTokenResponse"]["parameterName"]
  >;
};

export interface AdminLoginRequestDto {
  username: string;
  password: string;
}

export interface AdminLoginResponseDto {
  authenticated?: boolean;
}

export interface AdminLogoutResponseDto {
  success?: boolean;
}
