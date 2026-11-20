import { adminOpenApiRequest } from "./adminOpenApiDispatch";
import type {
  AdminCsrfTokenDto,
  AdminIdentityDto,
  AdminLoginResponseDto,
  AdminLogoutResponseDto,
} from "@tgp/contracts";

import {
  adminFetch,
  clearAdminCsrfCache,
  getAdminCsrfToken,
  type AdminFetchOptions,
} from "./adminFetch";

export interface AdminLoginCredentials {
  usernameOrEmail: string;
  password: string;
}

export interface AdminAuthClientOptions {
  baseUrl: string | URL;
  fetcher?: typeof fetch;
}

export interface AdminAuthClient {
  getCsrfToken(): Promise<AdminCsrfTokenDto>;
  login(credentials: AdminLoginCredentials): Promise<AdminLoginResponseDto>;
  logout(): Promise<AdminLogoutResponseDto | null>;
  me(signal?: AbortSignal): Promise<AdminIdentityDto>;
  clearCsrfToken(): void;
}

export function createAdminAuthClient(
  options: AdminAuthClientOptions,
): AdminAuthClient {
  const baseOptions = {
    baseUrl: options.baseUrl,
    fetcher: options.fetcher,
  } satisfies Pick<AdminFetchOptions, "baseUrl" | "fetcher">;

  return {
    getCsrfToken() {
      return getAdminCsrfToken(options.baseUrl, options.fetcher);
    },
    login(credentials) {
      const body = new URLSearchParams({
        username: credentials.usernameOrEmail,
        password: credentials.password,
      });

      return adminFetch<AdminLoginResponseDto>("/api/v1/admin/auth/login", {
        ...baseOptions,
        method: "POST",
        headers: {
          "content-type": "application/x-www-form-urlencoded",
        },
        body,
      });
    },
    async logout() {
      try {
        return await adminFetch<AdminLogoutResponseDto | null>(
          "/api/v1/admin/auth/logout",
          {
            ...baseOptions,
            method: "POST",
          },
        );
      } finally {
        clearAdminCsrfCache(options.baseUrl);
      }
    },
    me(signal) {
      return adminOpenApiRequest<AdminIdentityDto>("/api/v1/admin/auth/me", {
        ...baseOptions,
        signal,
      });
    },
    clearCsrfToken() {
      clearAdminCsrfCache(options.baseUrl);
    },
  };
}
