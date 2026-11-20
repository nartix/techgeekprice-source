import type { AuthProvider } from "@refinedev/core";
import type { AdminAuthClient } from "@tgp/api-client";

import {
  toLocalizedAdminLoginPath,
  toLocalizedAdminPath,
} from "../navigation/adminLocalePaths";
import {
  clearAdminIdentity,
  getAdminIdentity,
  setAdminIdentity,
} from "../session/adminIdentityStore";
import type { AdminIdentity } from "../types/admin.types";
import { canAccessAdminDashboard } from "../utils/adminPermissions";

type Locale = "en-CA" | "en-US" | "fr-CA";

export type AdminCheckResult = Awaited<ReturnType<AuthProvider["check"]>>;

interface AdminAuthProviderOptions {
  onCheck?: (result: AdminCheckResult) => void;
  isActive?: () => boolean;
  authClient: AdminAuthClient;
  locale: Locale;
}

export function createAdminAuthProvider({
  authClient,
  locale,
  onCheck,
  isActive = () => true,
}: AdminAuthProviderOptions): AuthProvider {
  let checkVersion = 0;
  const loginPath = toLocalizedAdminLoginPath(locale);

  return {
    login: async (params) => {
      try {
        await authClient.login({
          usernameOrEmail: String(params.usernameOrEmail ?? ""),
          password: String(params.password ?? ""),
        });
      } catch (error) {
        clearAdminIdentity();
        authClient.clearCsrfToken();

        return {
          success: false,
          error: adminAuthError(
            "Admin sign in failed.",
            getLoginFailureErrorName(error),
          ),
        };
      }

      try {
        const identity = await authClient.me();

        if (!canAccessAdminDashboard(identity)) {
          clearAdminIdentity();
          authClient.clearCsrfToken();
          await safelyLogout(authClient);

          return {
            success: false,
            redirectTo: loginPath,
            error: adminAuthError(
              "This account cannot access the admin dashboard.",
              "AdminForbiddenError",
            ),
          };
        }

        setAdminIdentity(identity);

        return {
          success: true,
          redirectTo: toLocalizedAdminPath(locale),
        };
      } catch {
        clearAdminIdentity();
        authClient.clearCsrfToken();

        return {
          success: false,
          error: adminAuthError(
            "Admin session could not be verified.",
            "AdminSessionVerificationError",
          ),
        };
      }
    },
    logout: async () => {
      checkVersion += 1;
      try {
        await authClient.logout();
      } finally {
        clearAdminIdentity();
        authClient.clearCsrfToken();
      }

      return {
        success: true,
        redirectTo: loginPath,
      };
    },
    check: async (params?: { signal?: AbortSignal }) => {
      const version = ++checkVersion;
      const signal = params?.signal;
      let result: AdminCheckResult;
      let verifiedIdentity: AdminIdentity | null = null;
      try {
        const identity = await verifyIdentity(authClient, signal);
        if (canAccessAdminDashboard(identity)) {
          verifiedIdentity = identity;
          result = { authenticated: true };
        } else {
          result = denied();
        }
      } catch (error) {
        if (signal?.aborted) return { authenticated: false, logout: false };
        const status = getErrorStatus(error);
        result =
          status === 401
            ? unauthenticated(loginPath)
            : status === 403
              ? denied()
              : {
                  authenticated: false,
                  logout: false,
                  error: adminAuthError(
                    "Session verification is temporarily unavailable.",
                    "AdminServiceUnavailableError",
                  ),
                };
      }
      // A replaced or unmounted verification has no authority over session state.
      if (version !== checkVersion || !isActive() || signal?.aborted) {
        // Refine auth methods must resolve; obsolete checks publish no state.
        return { authenticated: false, logout: false };
      }
      if (verifiedIdentity) setAdminIdentity(verifiedIdentity);
      else clearAdminIdentity();
      if (result.redirectTo) authClient.clearCsrfToken();
      onCheck?.(result);
      return result;
    },
    getIdentity: async () => getAdminIdentity(),
    getPermissions: async () => getAdminIdentity()?.permissions ?? [],
    onError: async (error) => {
      if (!isActive()) return {};
      const status = getErrorStatus(error);

      if (status === 401) {
        checkVersion += 1;
        clearAdminIdentity();
        authClient.clearCsrfToken();

        const result = unauthenticated(loginPath);
        onCheck?.(result);
        return { logout: true, redirectTo: loginPath, error: result.error };
      }

      if (status === 403) {
        authClient.clearCsrfToken();
        return {};
      }

      return {};
    },
  };
}

/** Bound both transport and body consumption, even if a client ignores abort. */
async function verifyIdentity(
  authClient: AdminAuthClient,
  parentSignal?: AbortSignal,
): Promise<AdminIdentity> {
  const controller = new AbortController();
  let timeout: ReturnType<typeof setTimeout> | undefined;
  let cancel = () => {};
  const interrupted = new Promise<never>((_resolve, reject) => {
    cancel = () => {
      controller.abort();
      reject(new DOMException("Verification cancelled.", "AbortError"));
    };
    timeout = setTimeout(() => {
      controller.abort();
      reject(new Error("Verification deadline reached."));
    }, 30_000);
    parentSignal?.addEventListener("abort", cancel, { once: true });
  });
  try {
    if (parentSignal?.aborted) cancel();
    return await Promise.race([authClient.me(controller.signal), interrupted]);
  } finally {
    clearTimeout(timeout);
    parentSignal?.removeEventListener("abort", cancel);
  }
}

function denied(): AdminCheckResult {
  return {
    authenticated: false,
    logout: false,
    error: adminAuthError(
      "This account cannot access the admin dashboard.",
      "AdminForbiddenError",
    ),
  };
}

function unauthenticated(redirectTo: string) {
  return {
    authenticated: false,
    logout: true,
    redirectTo,
    error: adminAuthError("Admin session is not authenticated."),
  };
}

function adminAuthError(message: string, name = "AdminLoginError"): Error {
  const error = new Error(message);
  error.name = name;
  return error;
}

function getLoginFailureErrorName(error: unknown): string {
  if (isAdminApiSetupError(error)) {
    return "AdminApiUnavailableError";
  }

  return "AdminLoginError";
}

function isAdminApiSetupError(error: unknown): boolean {
  const code = getErrorCode(error);
  const status = getErrorStatus(error);

  return (
    code === "api_client.request.failed" ||
    code === "api_client.admin.csrf_unavailable" ||
    code === "api_client.response.invalid_json" ||
    status === 403
  );
}

async function safelyLogout(authClient: AdminAuthClient): Promise<void> {
  try {
    await authClient.logout();
  } catch {
    // Logout is best-effort after a denied identity; local state is already clear.
  }
}

function getErrorStatus(error: unknown): number | undefined {
  if (!error || typeof error !== "object") {
    return undefined;
  }

  if ("status" in error && typeof error.status === "number") {
    return error.status;
  }

  if ("statusCode" in error && typeof error.statusCode === "number") {
    return error.statusCode;
  }

  return undefined;
}

function getErrorCode(error: unknown): string | undefined {
  if (!error || typeof error !== "object") {
    return undefined;
  }

  if ("code" in error && typeof error.code === "string") {
    return error.code;
  }

  return undefined;
}
